import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import mockData from "./mock-data.json";
import ImageViewer from "./ImageViewer";
import ImageCarousel from "./ImageCarousel";

function App() {
  const toolOutput = useWidgetProps({});
  
  // 图片查看器状态
  const [viewingImage, setViewingImage] = useState(null);
  
  // 优先使用 toolOutput 中的数据，如果没有则使用 mockData
  const draft = toolOutput?.title || toolOutput?.content || toolOutput?.text
    ? toolOutput
    : mockData;

  // 确保有数据
  if (!draft || (!draft.title && !draft.content && !draft.text)) {
    return (
      <div className="antialiased w-full text-black px-4 pb-4 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
        <div className="max-w-full">
          <div className="py-8 text-center text-black/60">
            暂无草稿内容
          </div>
        </div>
      </div>
    );
  }

  // 统一转换所有图片 URL：heif -> webp
  const imageList = draft.image_list || draft.images || [];
  const processedImages = imageList.map(url => url.replace(/format\/heif/gi, 'format/webp'));

  // 获取标题和正文
  const title = draft.title || draft.display_title || "";
  const content = draft.content || draft.text || draft.desc || "";

  return (
    <div className="antialiased w-full max-w-4xl mx-auto text-black border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full px-6 py-6">
        {/* 图片列表 */}
        {processedImages.length > 0 && (
          <ImageCarousel 
            images={processedImages} 
            title={title}
            onImageClick={setViewingImage}
          />
        )}

        {/* 标题 */}
        {title && (
          <h1 className="text-lg sm:text-xl font-bold text-black mb-4 leading-tight">
            {title}
          </h1>
        )}

        {/* 正文 */}
        {content && (
          <div className="text-sm sm:text-base text-black/70 mb-4 leading-tight whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>

      {/* 图片查看器 */}
      {viewingImage && (
        <ImageViewer 
          image={viewingImage} 
          onClose={() => setViewingImage(null)} 
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("post-draft-root")).render(<App />);

export { App };
export default App;

