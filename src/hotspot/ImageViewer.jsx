import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

function ImageViewer({ image, onClose }) {
  const [visible, setVisible] = useState(false);

  // 当 image 改变时，触发动画
  useEffect(() => {
    if (image) {
      // 延迟一帧以确保 DOM 更新后再触发动画
      requestAnimationFrame(() => {
        setVisible(true);
      });
    } else {
      setVisible(false);
    }
  }, [image]);

  // 键盘事件监听：ESC键关闭图片
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && image) {
        onClose();
      }
    };
    
    if (image) {
      window.addEventListener("keydown", handleKeyDown);
      // 防止背景滚动
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300"
      style={{ 
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        opacity: visible ? 1 : 0
      }}
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        aria-label="关闭图片"
        className="absolute top-4 right-4 z-10 rounded-full bg-white/90 text-black shadow-lg ring ring-black/5 p-2.5 pointer-events-auto hover:bg-white transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.8)"
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X
          strokeWidth={1.5}
          className="h-5 w-5"
          aria-hidden="true"
        />
      </button>
      
      {/* 图片容器 */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.9)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image}
          alt="查看图片"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
    </div>
  );
}

export default ImageViewer;

