import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import { useOpenAiGlobal } from "../use-openai-global";
import { Maximize2, X } from "lucide-react";
import mockData from "./mock-data.json";
import ImageViewer from "./ImageViewer";

function App() {
  // toolOutput 返回的是整个 mockData 对象（包含 title, introduction, posts, conclusion）
  // 从 server.ts 中看到：structuredContent: mockData
  const toolOutput = useWidgetProps({});
  const displayMode = useOpenAiGlobal("displayMode");
  //const isFullscreen = displayMode === "fullscreen";
  const isFullscreen = true;
  
  // 图片查看器状态
  const [viewingImage, setViewingImage] = useState(null);
  
  // 优先使用 toolOutput 中的数据，如果没有则使用 mockData
  const data = (toolOutput && toolOutput.posts && Array.isArray(toolOutput.posts))
    ? toolOutput
    : mockData;

  // 确保 data.posts 存在
  if (!data || !data.posts || !Array.isArray(data.posts)) {
    return (
      <div className="antialiased w-full text-black px-4 pb-4 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
        <div className="max-w-full">
          <div className="py-8 text-center text-black/60">
            拿不到数据
          </div>
        </div>
      </div>
    );
  }

  // 统一转换所有图片 URL：heif -> webp
  data.posts.forEach(post => {
    if (post.avatar) post.avatar = post.avatar.replace(/format\/heif/gi, 'format/webp');
    if (post.cover) post.cover = post.cover.replace(/format\/heif/gi, 'format/webp');
    if (post.image_list) {
      post.image_list = post.image_list.map(url => url.replace(/format\/heif/gi, 'format/webp'));
    }
  });

  const firstPost = data.posts[0];

  // 插入模式：只显示封面
  if (!isFullscreen) {
    return (
      <div className="antialiased w-full max-w-4xl mx-auto text-black border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white relative">
        {/* 全屏按钮 */}
        <button
          aria-label="Enter fullscreen"
          className="absolute top-4 right-4 z-30 rounded-full bg-white text-black shadow-lg ring ring-black/5 p-2.5 pointer-events-auto"
          onClick={() => {
            if (window?.webplus?.requestDisplayMode) {
              window.webplus.requestDisplayMode({ mode: "fullscreen" });
            }
          }}
        >
          <Maximize2
            strokeWidth={1.5}
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        </button>

        <div className="relative">
          {/* 封面图片 */}
          {(firstPost?.cover || (firstPost?.image_list && firstPost.image_list.length > 0)) && (
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
              <img
                src={firstPost.cover || firstPost.image_list[0]}
                alt={data.title || "Post"}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm" style={{ display: "none" }}>
                图片加载失败
              </div>
            </div>
          )}
          
          {/* 封面信息 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            {data.title && (
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 line-clamp-2 leading-tight">
                {data.title}
              </h2>
            )}
            {data.introduction && (
              <p className="text-xs text-white/90 line-clamp-2 leading-normal mb-2">
                {data.introduction}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 全屏模式：显示所有内容
  return (
    <div className="antialiased w-full max-w-4xl mx-auto text-black border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white relative">
      {/* 退出全屏按钮 */}
      <button
        aria-label="Exit fullscreen"
        className="absolute top-4 right-4 z-30 rounded-full bg-white text-black shadow-lg ring ring-black/5 p-2.5 pointer-events-auto"
        onClick={() => {
          if (window?.webplus?.requestDisplayMode) {
            window.webplus.requestDisplayMode({ mode: "inline" });
          }
        }}
      >
        <X
          strokeWidth={1.5}
          className="h-4.5 w-4.5"
          aria-hidden="true"
        />
      </button>

      <div className="max-w-full px-2 pb-4">
        {/* 封面 */}
        <div className="mt-3 mb-4">
          <div className="bg-[#EEEEEE] border border-black/5 rounded-2xl overflow-hidden relative">
            {(firstPost?.cover || (firstPost?.image_list && firstPost.image_list.length > 0)) && (
              <div 
                className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100"
              >
                <img
                  src={firstPost.cover || firstPost.image_list[0]}
                  alt={data.title || "Post"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm" style={{ display: "none" }}>
                  图片加载失败
                </div>
              </div>
            )}
            
            {/* 封面信息 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              {data.title && (
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 line-clamp-2 leading-tight">
                  {data.title}
                </h2>
              )}
              {data.introduction && (
                <p className="text-xs text-white/90 line-clamp-2 leading-normal mb-2">
                  {data.introduction}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Posts List */}
        <div className="space-y-5">
          {data.posts && data.posts.length > 0 ? (
            data.posts.map((post, index) => (
              <div key={post.note_id} className="space-y-2">
                {/* 排名 */}
                <div className="text-2xl font-bold text-[#999999] text-center mt-10 mb-4">
                  TOP {index + 1}
                </div>
                
                {/* 卡片 */}
                <div className="bg-[#EEEEEE] border border-black/5 rounded-2xl p-4 space-y-4">
                  {/* 标题 */}
                  <h2 className="text-lg font-bold text-black leading-tight text-center">
                    {post.display_title}
                  </h2>
                  
                  {/* 作者信息 */}
                  <div className="flex items-center justify-center gap-2">
                    {post.avatar && (
                      <img
                        src={post.avatar}
                        alt={post.nickname}
                        className="w-6 h-6 rounded-full"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    {post.nickname && (
                      <span className="text-xs text-black/60">{post.nickname}</span>
                    )}
                  </div>
                  
                  {/* 统计数据 */}
                  <div className="flex items-center justify-center gap-4 text-xs text-black/60">
                    <span>👍 {post.liked_count ? (post.liked_count >= 1000 ? (post.liked_count / 1000).toFixed(2) + 'k' : post.liked_count) : '0'}</span>
                    <span>⭐ {post.collected_count ? (post.collected_count >= 1000 ? (post.collected_count / 1000).toFixed(2) + 'k' : post.collected_count) : '0'}</span>
                    <span>💬 {post.comments_count || 0}</span>
                    <span>📤 {post.shared_count || 0}</span>
                  </div>
                  
                  {/* 图片网格 */}
                  {post.image_list && post.image_list.length > 0 && (() => {
                    const imageCount = Math.min(post.image_list.length, 6);
                    const gridCols = imageCount === 1 ? 'grid-cols-1' : imageCount === 2 ? 'grid-cols-2' : 'grid-cols-3';
                    return (
                      <div className={`grid ${gridCols} gap-2 ${imageCount === 1 ? 'justify-items-center' : ''}`}>
                        {post.image_list.slice(0, 6).map((img, idx) => (
                          <div 
                            key={idx} 
                            className={`relative bg-gray-100 ${imageCount === 1 ? 'rounded-3xl' : 'rounded-xl'} overflow-hidden ${imageCount === 1 ? 'w-[60%]' : 'w-full'} cursor-pointer`}
                            onClick={() => isFullscreen && setViewingImage(img)}
                          >
                            <img
                              src={img}
                              alt={`${post.display_title} ${idx + 1}`}
                              className="w-full h-auto object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  
                  {/* 正文和分析卡片 */}
                  {(post.desc || post.note_analysis) && (
                    <div className="space-y-2">
                      {/* 正文 */}
                      {post.desc && (
                        <div className="bg-white rounded-xl p-3">
                          <h3 className="text-sm font-bold text-black/80 mb-2">正文</h3>
                          <p className="text-sm text-black/70 leading-relaxed line-clamp-3">
                            {post.desc}
                          </p>
                        </div>
                      )}
                      
                      {/* 分析卡片 */}
                      {post.note_analysis && (
                        <>
                      {post.note_analysis.operations && (
                        <div className="bg-white rounded-xl p-3">
                          <h3 className="text-sm font-bold text-black/80 mb-2">运营分析</h3>
                          <p className="text-xs text-black/70 leading-relaxed">
                            {post.note_analysis.operations}
                          </p>
                        </div>
                      )}
                      {post.note_analysis.aesthetics && (
                        <div className="bg-white rounded-xl p-3">
                          <h3 className="text-sm font-bold text-black/80 mb-2">美学分析</h3>
                          <p className="text-xs text-black/70 leading-relaxed">
                            {post.note_analysis.aesthetics}
                          </p>
                        </div>
                      )}
                      {post.note_analysis.summarize && (
                        <div className="bg-black rounded-xl p-3">
                          <h3 className="text-sm font-bold text-white/90 mb-2">总结</h3>
                          <p className="text-xs text-white/80 leading-relaxed">
                            {post.note_analysis.summarize}
                          </p>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  )}
                </div>
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
          <div className="mt-5 space-y-2">
            <h3 className="text-2xl font-semibold text-black/60 text-center">结语</h3>
            <div className="bg-[#EEEEEE] border border-black/5 rounded-2xl p-4 space-y-3">
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-black/70 leading-relaxed">
                  <span className="font-medium text-green-700"></span>{" "}
                  {data.conclusion.positive}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-black/70 leading-relaxed">
                  <span className="font-medium text-red-700"></span>{" "}
                  {data.conclusion.negative}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 图片查看器 */}
      <ImageViewer 
        image={viewingImage} 
        onClose={() => setViewingImage(null)} 
      />
    </div>
  );
}

createRoot(document.getElementById("post-root")).render(<App />);

export { App };
export default App;

