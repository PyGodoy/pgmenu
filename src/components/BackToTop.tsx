
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "./ui/button";

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 500);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      className={`back-to-top fixed bottom-8 right-8 rounded-full p-3 shadow-lg transition-all duration-300 ${
        isVisible ? "visible" : ""
      }`}
      onClick={scrollToTop}
      size="icon"
    >
      <ArrowUp className="h-5 w-5" />
      <span className="sr-only">Back to top</span>
    </Button>
  );
};
