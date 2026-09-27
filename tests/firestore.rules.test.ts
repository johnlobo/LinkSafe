import { readFileSync } from 'node:fs';

import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const PROJECT_ID = 'demo-linksafe';

let testEnvironment: RulesTestEnvironment;

function validBookmark(userId: string) {
  return {
    userId,
    url: 'https://example.com',
    title: 'Example',
    tags: ['Private'],
    favorite: false,
    createdAt: Timestamp.now(),
  };
}

function validPrompt(userId: string) {
  const timestamp = Timestamp.now();
  return {
    userId,
    title: 'Review code',
    content: 'Review this code carefully.',
    tags: ['Development'],
    favorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('bookmark privacy', () => {
  it('allows the owner to read a bookmark and rejects another user', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'bookmarks/bookmark-a'), validBookmark('user-a'));
    });

    const ownerDoc = doc(testEnvironment.authenticatedContext('user-a').firestore(), 'bookmarks/bookmark-a');
    const otherUserDoc = doc(testEnvironment.authenticatedContext('user-b').firestore(), 'bookmarks/bookmark-a');

    await assertSucceeds(getDoc(ownerDoc));
    await assertFails(getDoc(otherUserDoc));
  });

  it('requires list queries to filter by the authenticated owner', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'bookmarks/bookmark-a'), validBookmark('user-a'));
      await setDoc(doc(context.firestore(), 'bookmarks/bookmark-b'), validBookmark('user-b'));
    });

    const firestore = testEnvironment.authenticatedContext('user-a').firestore();
    const ownedQuery = query(collection(firestore, 'bookmarks'), where('userId', '==', 'user-a'));

    await assertSucceeds(getDocs(ownedQuery));
    await assertFails(getDocs(collection(firestore, 'bookmarks')));
  });

  it('accepts a legacy bookmark without favorite and rejects an owner change', async () => {
    const firestore = testEnvironment.authenticatedContext('user-a').firestore();
    const bookmarkRef = doc(firestore, 'bookmarks/bookmark-a');

    await assertSucceeds(setDoc(bookmarkRef, {
      userId: 'user-a',
      url: 'https://example.com',
      title: 'Legacy bookmark',
      tags: [],
      createdAt: serverTimestamp(),
    }));
    await assertFails(updateDoc(bookmarkRef, { userId: 'user-b' }));
  });
});

describe('prompt privacy and validation', () => {
  it('allows the owner to create a valid prompt', async () => {
    const promptRef = doc(testEnvironment.authenticatedContext('user-a').firestore(), 'prompts/prompt-a');

    await assertSucceeds(setDoc(promptRef, {
      ...validPrompt('user-a'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('rejects unknown fields and non-web source URLs', async () => {
    const firestore = testEnvironment.authenticatedContext('user-a').firestore();

    await assertFails(setDoc(doc(firestore, 'prompts/unknown-field'), {
      ...validPrompt('user-a'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      unexpected: true,
    }));
    await assertFails(setDoc(doc(firestore, 'prompts/unsafe-url'), {
      ...validPrompt('user-a'),
      sourceUrl: 'javascript:alert(1)',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('rejects invalid tag values and prompt size limits', async () => {
    const firestore = testEnvironment.authenticatedContext('user-a').firestore();

    await assertFails(setDoc(doc(firestore, 'prompts/invalid-tag-type'), {
      ...validPrompt('user-a'),
      tags: ['valid', 42],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    await assertFails(setDoc(doc(firestore, 'prompts/tag-too-long'), {
      ...validPrompt('user-a'),
      tags: ['x'.repeat(51)],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    await assertFails(setDoc(doc(firestore, 'prompts/content-too-long'), {
      ...validPrompt('user-a'),
      content: 'x'.repeat(50001),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('rejects cross-user access and preserves immutable ownership', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'prompts/prompt-a'), validPrompt('user-a'));
    });

    const ownerRef = doc(testEnvironment.authenticatedContext('user-a').firestore(), 'prompts/prompt-a');
    const otherUserRef = doc(testEnvironment.authenticatedContext('user-b').firestore(), 'prompts/prompt-a');

    await assertFails(getDoc(otherUserRef));
    await assertFails(deleteDoc(otherUserRef));
    await assertFails(updateDoc(ownerRef, { userId: 'user-b', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ownerRef, { favorite: true, updatedAt: serverTimestamp() }));
  });
});
