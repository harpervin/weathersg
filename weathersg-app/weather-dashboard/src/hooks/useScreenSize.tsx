import { useState, useEffect } from "react";

const useScreenSize = () => {
    const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 1024); // Small screen: width <= 768px
        };

        // Check screen size initially
        handleResize();

        // Listen for window resize
        window.addEventListener("resize", handleResize);

        // Cleanup listener on unmount
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isSmallScreen;
};

export default useScreenSize;
