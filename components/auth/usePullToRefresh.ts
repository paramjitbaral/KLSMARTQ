import { useEffect } from "react";

export const usePullToRefresh = () => {
  useEffect(() => {
    let startY = 0;
    let isPulling = false;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // User pulled down more than 70px
      if (diff > 70) {
        isPulling = false;
        window.location.reload();
      }
    };

    const onTouchEnd = () => {
      isPulling = false;
    };

    // For laptops (mouse drag)
    let mouseStartY = 0;
    let mouseDown = false;

    const onMouseDown = (e: MouseEvent) => {
      if (window.scrollY === 0) {
        mouseDown = true;
        mouseStartY = e.clientY;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDown) return;

      const diff = e.clientY - mouseStartY;

      if (diff > 90) {
        mouseDown = false;
        window.location.reload();
      }
    };

    const onMouseUp = () => {
      mouseDown = false;
    };

    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);

      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);
};
