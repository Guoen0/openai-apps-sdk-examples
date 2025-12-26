import React from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import mockData from "./mock-data.json";

function App() {
  // 接收从服务器传来的 structuredContent 数据
  const toolOutput = useWidgetProps({});
  
  // 优先使用 toolOutput 中的数据，如果没有则使用 mockData
  const responseData = toolOutput && (toolOutput.data || toolOutput.items || toolOutput.data?.items) ? toolOutput : mockData;
  
  // 新的数据结构：data 数组，每个元素包含 searchContent 数组
  // 需要将所有 searchContent 展平并提取视频内容
  const dataArray = responseData?.data || [];
  const items = dataArray.flatMap(entity => 
    (entity.searchContent || [])
      .filter(content => content) // 过滤掉 null 或 undefined
      .map(content => ({
        note_id: content.contentId,
        cover: content.coverUrl,
        display_title: content.title || content.description,
        avatar: content.avatarUrl,
        nickname: content.authorName,
        liked_count: content.likeCount,
        comment_count: content.commentCount,
        share_count: content.shareCount,
        // 保留原始数据以便后续使用
        originalContent: content,
        entityTitle: entity.title,
        entityId: entity.entityId
      }))
  );
  
  // 限制显示20个帖子
  const displayItems = items.slice(0, 20);

  // 统一转换所有图片 URL：heif -> webp
  const convertImageUrl = (url) => {
    if (!url) return url;
    return url.replace(/format\/heif/gi, 'format/webp');
  };

  // 格式化数字
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="antialiased w-full max-w-7xl mx-auto text-black border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white h-[200px] flex flex-col relative">
      {/* 顶部渐变遮罩 */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-10" />
      
      {/* 滚动区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative">
        
        {displayItems.length === 0 ? (
          <div className="py-12 text-center text-black/60">
            <p>暂无帖子数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayItems.map((item) => (
              <div key={item.note_id} className="space-y-2">
                {/* 圆角矩形：只包含图片 */}
                <div className="bg-gray-50 rounded-2xl overflow-hidden border border-black/5 hover:shadow-lg transition-all cursor-pointer group">
                  {item.cover && (
                    <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={convertImageUrl(item.cover)}
                        alt={item.display_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 文字内容：放在圆角矩形外面 */}
                <div className="space-y-1">
                  {/* 标题 */}
                  <h3 className="text-xs font-normal line-clamp-1 leading-tight">
                    {item.display_title}
                  </h3>

                  {/* 作者信息和点赞数 */}
                  <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.avatar && (
                        <img
                          src={convertImageUrl(item.avatar)}
                          alt={item.nickname}
                          className="w-5 h-5 rounded-full flex-shrink-0"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      {item.nickname && (
                        <span className="text-xs text-black/60 truncate min-w-0">
                          {item.nickname}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-black/50 flex-shrink-0">
                      <span>❤️</span>
                      <span>{formatNumber(item.liked_count || 0)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-10" />
    </div>
  );
}

const root = createRoot(document.getElementById("hotspot-scraping-root"));
root.render(<App />);
