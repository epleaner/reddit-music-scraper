export default function SearchHistory({
  history,
  clearHistory,
  onSearch,
}: {
  history: string[];
  clearHistory: () => void;
  onSearch: (url: string) => void;
}) {
  if (!history.length) return null;
  return (
    <div className='w-full max-w-md mt-8'>
      <div className='mb-4 w-full bg-white/25 h-[1px]' />
      <div className='flex justify-between items-center mb-2'>
        <h3 className=''>Recent searches</h3>
        <button
          onClick={clearHistory}
          className='text-white text-xs hover:border-gray-400 transition-colors'>
          Clear
        </button>
      </div>
      <ul className='list-disc pl-5'>
        {history.map((url, index) => (
          <li key={index} className='text-xs'>
            <div
              onClick={() => onSearch(url)}
              className='text-blue-500 hover:underline hover:cursor-pointer'>
              {url}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
