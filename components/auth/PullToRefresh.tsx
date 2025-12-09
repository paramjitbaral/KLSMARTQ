import React, { useEffect, useState } from "react";

interface Props {
  onRefresh: () => void;
}

const PullToRefresh: React.FC<Props> = ({ onRefresh }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  let startY = 0;
  let pulling = false;

  const MAX_PULL = 120; // Pull distance
  const TRIGGER_PULL = 90; // How far to release to refresh

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        pulling = true;
        startY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;

      const diff = e.touches[0].clientY - startY;

      if (diff > 0) {
        e.preventDefault();
        setPullDistance(Math.min(diff, MAX_PULL));
      }
    };

    const onTouchEnd = () => {
      if (pullDistance > TRIGGER_PULL) {
        setIsRefreshing(true);

        setTimeout(() => {
          onRefresh();
          setPullDistance(0);
          setIsRefreshing(false);
        }, 600);
      } else {
        setPullDistance(0);
      }

      pulling = false;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance]);

  return (
    <div
      className="w-full flex justify-center items-end"
      style={{
        height: isRefreshing ? 60 : pullDistance * 0.6,
        transition: isRefreshing ? "height 0.3s ease" : "none",
      }}
    >
      {/* Spinner or Pull Indicator */}
      {pullDistance > 0 && !isRefreshing && (
        <div
          className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full"
          style={{
            transform: `rotate(${pullDistance * 2}deg)`,
            transition: "transform 0.1s linear",
          }}
        ></div>
      )}

      {isRefreshing && (
        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
      )}
    </div>
  );
};

export default PullToRefresh;
