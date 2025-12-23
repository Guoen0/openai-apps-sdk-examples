import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import { useOpenAiGlobal } from "../use-openai-global";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mockData from "./mock-data.json";

function App() {
  // 接收从服务器传来的 structuredContent 数据
  const toolOutput = useWidgetProps({});
  const displayMode = useOpenAiGlobal("displayMode");
  const isFullscreen = displayMode === "fullscreen";

  // 从 toolOutput 中获取 markdown 内容
  // 优先使用 toolOutput 中的数据，如果没有则使用 mockData
  const markdownContent = 
    toolOutput?.markdown || 
    mockData?.markdown ||
    "";

  return (
    <div className={`antialiased w-full text-black border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white ${
      isFullscreen ? 'min-h-screen' : 'h-[320px]'
    } flex flex-col relative`}>
      {/* 顶部渐变遮罩 */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-10" />
      
      {/* 滚动区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 relative">
        <div className="markdown-content text-xs">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1({ children, ...props }) {
                return <h1 className="text-lg font-semibold mb-3 mt-0 text-black" {...props}>{children}</h1>;
              },
              h2({ children, ...props }) {
                return <h2 className="text-base font-semibold mb-2 mt-4 text-black" {...props}>{children}</h2>;
              },
              h3({ children, ...props }) {
                return <h3 className="text-sm font-semibold mb-2 mt-3 text-black" {...props}>{children}</h3>;
              },
              h4({ children, ...props }) {
                return <h4 className="text-sm font-semibold mb-1 mt-3 text-black" {...props}>{children}</h4>;
              },
              p({ children, ...props }) {
                return <p className="mb-3 leading-relaxed text-xs text-black" {...props}>{children}</p>;
              },
              ul({ children, ...props }) {
                return <ul className="list-disc pl-5 mb-3 text-xs text-black [&_*]:text-xs" {...props}>{children}</ul>;
              },
              ol({ children, ...props }) {
                return <ol className="list-decimal pl-5 mb-3 text-xs text-black [&_*]:text-xs" {...props}>{children}</ol>;
              },
              li({ children, ...props }) {
                return <li className="mb-1 leading-relaxed text-xs text-black [&_*]:text-xs" {...props}>{children}</li>;
              },
              blockquote({ children, ...props }) {
                return <blockquote className="border-l-4 border-gray-300 pl-4 italic text-sm text-gray-700 my-3" {...props}>{children}</blockquote>;
              },
              code({ inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-3 text-xs">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-black" {...props}>
                    {children}
                  </code>
                );
              },
              a({ href, children, ...props }) {
                return (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              table({ children, ...props }) {
                return (
                  <div className="overflow-x-auto my-3">
                    <table className="w-full border-collapse border border-gray-300 text-xs" {...props}>
                      {children}
                    </table>
                  </div>
                );
              },
              thead({ children, ...props }) {
                return <thead className="bg-gray-50" {...props}>{children}</thead>;
              },
              th({ children, ...props }) {
                return <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold leading-relaxed text-xs text-black" {...props}>{children}</th>;
              },
              td({ children, ...props }) {
                return <td className="border border-gray-300 px-3 py-1.5 leading-relaxed text-xs text-black" {...props}>{children}</td>;
              },
              img({ src, alt, ...props }) {
                return <img src={src} alt={alt} className="rounded-lg my-4 max-w-full h-auto" {...props} />;
              },
              hr({ ...props }) {
                return <hr className="border-t border-gray-300 my-6" {...props} />;
              },
              strong({ children, ...props }) {
                return <strong className="font-semibold text-black" {...props}>{children}</strong>;
              },
              em({ children, ...props }) {
                return <em className="italic" {...props}>{children}</em>;
              },
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
      
      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-10" />
    </div>
  );
}

createRoot(document.getElementById("markdown-render-root")).render(<App />);

export { App };
export default App;
