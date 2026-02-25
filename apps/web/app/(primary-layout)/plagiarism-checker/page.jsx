import PlagiarismCheckerContentSection from "@/components/(primary-layout)/(plagiarism-checker)/PlagiarismCheckerContentSection";
import ToolPageWrapper from "@/components/tools/common/ToolPageWrapper";

export const dynamic = 'force-dynamic';

const PlagiarismCheckerPage = () => {
  return (
    <div>
      <ToolPageWrapper tool="plagiarism">
        <PlagiarismCheckerContentSection />
      </ToolPageWrapper>
    </div>
  );
};

export default PlagiarismCheckerPage;
