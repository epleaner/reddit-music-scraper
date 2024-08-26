import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function SearchHistory({
  history,
  onSearch,
}: {
  history: string[];
  onSearch: (url: string) => void;
}) {
  if (!history.length) return null;
  return (
    <>
      <div className='mt-8 w-full max-w-md bg-stone-300/25 h-[1px]' />
      <Accordion
        type='single'
        collapsible
        className='w-full max-w-md [&_*]:border-b-0'>
        <AccordionItem value='search-history'>
          <AccordionTrigger>
            <h3 className='text-xs group-hover:no-underline'>
              Recent searches
            </h3>
          </AccordionTrigger>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
