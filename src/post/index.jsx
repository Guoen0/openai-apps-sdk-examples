import React from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import mockData from "./mock-data.json";

function App() {
  // 接收从服务器传来的 structuredContent 数据
  // 如果在开发环境且没有收到数据，则使用 mock 数据
  const receivedProps = useWidgetProps({});
  const data = receivedProps.title ? receivedProps : mockData;

  return (
    <div className="antialiased w-full text-black px-4 pb-4 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full">
        {/* Header */}
        <div className="border-b border-black/5 py-4">
          <h1 className="text-xl font-semibold">{data.title || "Posts"}</h1>
          {data.introduction && (
            <p className="text-sm text-black/60 mt-1">{data.introduction}</p>
          )}
        </div>

        {/* Posts List */}
        <div className="mt-4 space-y-4">
          {data.posts && data.posts.length > 0 ? (
            data.posts.map((post) => (
              <div
                key={post.id}
                className="p-4 border border-black/5 rounded-xl hover:bg-black/5 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  {post.author?.avatar && (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-black/40">
                        {post.rank}
                      </span>
                      <h2 className="text-base font-semibold flex-1">
                        {post.topic}
                      </h2>
                    </div>
                    {post.author?.name && (
                      <p className="text-xs text-black/50 mb-2">
                        {post.author.name}
                      </p>
                    )}
                  </div>
                </div>
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {post.images.slice(0, 3).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${post.topic} ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm text-black/70 mb-3">{post.content}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-black/5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {post.stats && (
                  <div className="flex items-center gap-4 text-xs text-black/50 pt-2 border-t border-black/5">
                    <span>❤️ {post.stats.likes || 0}</span>
                    <span>💬 {post.stats.comments || 0}</span>
                    <span>⭐ {post.stats.collects || 0}</span>
                    <span>📤 {post.stats.shares || 0}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-black/60">
              No posts found
            </div>
          )}
        </div>

        {/* Conclusion */}
        {data.conclusion && (
          <div className="mt-6 pt-4 border-t border-black/5">
            <h3 className="text-sm font-semibold mb-2">结语</h3>
            <div className="space-y-2 text-xs text-black/70">
              <p>
                <span className="font-medium text-green-700">正面技巧：</span>{" "}
                {data.conclusion.positive}
              </p>
              <p>
                <span className="font-medium text-red-700">负面提醒：</span>{" "}
                {data.conclusion.negative}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("post-root")).render(<App />);

export { App };
export default App;

