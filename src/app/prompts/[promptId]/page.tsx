import { PromptDetailPage } from '@/components/prompts/prompt-detail-page';

export default async function PromptPage({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  return <PromptDetailPage promptId={promptId} />;
}
