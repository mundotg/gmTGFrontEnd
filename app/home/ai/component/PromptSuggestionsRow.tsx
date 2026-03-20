const PromptSuggestionButton = ({ text, onClick }:any) => {
  return (
    <button
      onClick={onClick}
      className="prompt-button text-sm py-2 px-4 rounded-lg overflow-hidden whitespace-nowrap focus:outline-none focus:shadow-outline dark:text-black"
    >
      {text}
    </button>
  );
};

export default function PromptSuggestionRow({ onPromptClick, comment, clearComment }: any) {
  if (comment) {
    return (
      <div className="flex justify-start items-center p-2 mb-4">
        {/* Chip feito apenas com Tailwind */}
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800 transition-all">
          <span>{comment}</span>
          <button 
            onClick={clearComment}
            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Assumindo que o array `prompts` vem de fora ou de um ficheiro de constantes
  const prompts = ["Como integrar uma API?", "Explica-me o que é RAG.", "Cria um ficheiro de configuração."];

  return (
    <div className="flex flex-row flex-wrap justify-center items-center py-4 gap-2">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton 
          key={`suggestion-${index}`} 
          text={prompt} 
          onClick={() => onPromptClick(prompt)} 
        />
      ))}
    </div>
  );
}