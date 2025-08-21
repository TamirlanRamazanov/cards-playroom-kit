import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
    onLoadComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadComplete }) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('Загрузка...');

    useEffect(() => {
        const mediaFiles = [
            '/going-merry-ship-one-piece-moewalls-com-compressed.mp4',
            '/menu_prototype.png',
            '/binks_sake_background.mp3'
        ];

        let loadedFiles = 0;
        const totalFiles = mediaFiles.length;

        const updateProgress = (fileName: string) => {
            loadedFiles++;
            const progress = Math.round((loadedFiles / totalFiles) * 100);
            setLoadingProgress(progress);
            
            // Обновляем текст загрузки
            if (fileName.includes('video') || fileName.includes('.mp4')) {
                setLoadingText('Загрузка видео...');
            } else if (fileName.includes('audio') || fileName.includes('.mp3')) {
                setLoadingText('Загрузка музыки...');
            } else if (fileName.includes('image') || fileName.includes('.png')) {
                setLoadingText('Загрузка UI...');
            }

            if (loadedFiles === totalFiles) {
                setTimeout(() => {
                    setLoadingText('Готово!');
                    setTimeout(onLoadComplete, 500);
                }, 300);
            }
        };

        // Предзагрузка видео
        const video = document.createElement('video');
        video.preload = 'auto';
        video.oncanplaythrough = () => updateProgress('video');
        video.onerror = () => updateProgress('video'); // На случай ошибки
        video.src = mediaFiles[0];

        // Предзагрузка изображения
        const img = new Image();
        img.onload = () => updateProgress('image');
        img.onerror = () => updateProgress('image');
        img.src = mediaFiles[1];

        // Предзагрузка аудио
        const audio = new Audio();
        audio.preload = 'auto';
        audio.oncanplaythrough = () => updateProgress('audio');
        audio.onerror = () => updateProgress('audio');
        audio.src = mediaFiles[2];

        // Таймаут на случай если что-то не загрузится
        const timeout = setTimeout(() => {
            if (loadedFiles < totalFiles) {
                setLoadingText('Завершение загрузки...');
                onLoadComplete();
            }
        }, 10000); // 10 секунд максимум

        return () => {
            clearTimeout(timeout);
        };
    }, [onLoadComplete]);

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0b1020 0%, #1a2a4a 50%, #0b1020 100%)",
                color: "#fff",
                fontFamily: "Pirata One, cursive",
            }}
        >
            {/* Логотип или название игры */}
            <div
                style={{
                    fontSize: "clamp(32px, 8vw, 72px)",
                    fontWeight: "bold",
                    color: "#8B0000",
                    textShadow: "3px 3px 6px rgba(0,0,0,0.8)",
                    marginBottom: "40px",
                    textAlign: "center",
                }}
            >
                PlayroomKit Game
            </div>

            {/* Прогресс бар */}
            <div
                style={{
                    width: "300px",
                    height: "20px",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    marginBottom: "20px",
                    border: "2px solid #8B0000",
                }}
            >
                <div
                    style={{
                        width: `${loadingProgress}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #8B0000 0%, #DC143C 50%, #8B0000 100%)",
                        borderRadius: "8px",
                        transition: "width 0.3s ease",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Анимированный блик */}
                    <div
                        style={{
                            position: "absolute",
                            top: "0",
                            left: "-100%",
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                            animation: "shine 2s infinite",
                        }}
                    />
                </div>
            </div>

            {/* Процент и текст загрузки */}
            <div
                style={{
                    fontSize: "18px",
                    color: "#e5e7eb",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    marginBottom: "10px",
                }}
            >
                {loadingProgress}%
            </div>

            <div
                style={{
                    fontSize: "16px",
                    color: "#8B0000",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
            >
                {loadingText}
            </div>

            {/* CSS анимация для блика */}
            <style>
                {`
                    @keyframes shine {
                        0% { left: -100%; }
                        100% { left: 100%; }
                    }
                `}
            </style>
        </div>
    );
};

export default LoadingScreen; 