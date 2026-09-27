import { PromptFormPage } from '@/components/prompts/prompt-form-page';

export default async function EditPromptPage({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  return <PromptFormPage mode="edit" promptId={promptId} />;
}
