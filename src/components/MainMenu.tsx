import React from 'react';

interface MainMenuProps {
    onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Видео фон */}
            <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 1,
                }}
            >
                <source src="/going-merry-ship-one-piece-moewalls-com-compressed.mp4" type="video/mp4" />
                Ваш браузер не поддерживает видео.
            </video>

            {/* Затемнение поверх видео для лучшей читаемости */}
            {/*
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0, 0, 0, 0.3)",
                    zIndex: 2,
                }}
            />
            */}

            {/* UI прототип изображение с кнопками */}
            <div
                style={{
                    position: "absolute",
                    top: "45%",
                    left: "25%", // Левее от центра
                    transform: "translate(-50%, -50%)",
                    zIndex: 3,
                    // Контейнер для изображения и кнопок
                    display: "inline-block",
                }}
            >
                <img
                    src="/menu_prototype.png"
                    alt="Menu UI Prototype"
                    style={{
                        maxWidth: "90vw",
                        maxHeight: "90vh",
                        width: "auto",
                        height: "auto",
                        display: "block", // Убираем лишние отступы
                    }}
                />

                {/* Кнопки позиционируются относительно изображения */}
                {/* Кнопка "Play" - позиция в процентах от размеров изображения */}
                <button
                    onClick={onStartGame}
                    style={{
                        position: "absolute",
                        top: "57%", // Измените на нужную позицию
                        left: "50%", // Измените на нужную позицию
                        transform: "translate(-50%, -50%) rotate(4deg)", // Наклон влево на 3 градуса
                        // Размеры в процентах от размеров изображения
                        width: "75%", // 20% от ширины изображения
                        height: "8%", // 8% от высоты изображения
                        border: "none", // "2px solid red", // Временно видимая граница для настройки
                        background: "transparent", //"rgba(255, 0, 0, 0.3)", // Временно видимый фон
                        cursor: "pointer",
                        fontSize: "clamp(12px, 3vw, 64px)", // Адаптивный размер шрифта
                        fontWeight: "bold",
                        color: "#8B0000", // Бордовый цвет
                        fontFamily: "Pirata One, cursive",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                        zIndex: 4,
                        // Центрирование текста
                        display: "flex",
                        alignItems: "flex-end",      /* Позиционируем от низа */
                        justifyContent: "center",    /* Горизонтальное центрирование */
                        paddingBottom: "3%",         /* Отступ снизу 3% */
                        
                        // Уберите эти стили после настройки позиции:
                        // border: "2px solid red",
                        // background: "rgba(255, 0, 0, 0.3)",
                    }}
                >
                    Play
                </button>

                {/* Примеры других кнопок - раскомментируйте и настройте по необходимости */}
                
                <button
                    onClick={() => console.log("Settings clicked")}
                    style={{
                        position: "absolute",
                        top: "68.5%", // Настройте позицию
                        left: "50%", // Настройте позицию
                        transform: "translate(-50%, -50%) rotate(4deg)",
                        width: "75%", // 20% от ширины изображения
                        height: "8%", // 8% от высоты изображения
                        border: "none", //"2px solid blue", // Временно видимая граница
                        background: "transparent", //"rgba(0, 0, 255, 0.3)", // Временно видимый фон
                        cursor: "pointer",
                        fontSize: "clamp(8px, 3vw, 64px)",
                        fontWeight: "bold",
                        color: "#8B0000",
                        fontFamily: "Pirata One, cursive",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                        zIndex: 4,

                        display: "flex",
                        alignItems: "flex-end",      /* Позиционируем от низа */
                        justifyContent: "center",    /* Горизонтальное центрирование */
                        paddingBottom: "3%",  
                    }}
                >
                    Settings
                </button>

                <button
                    onClick={() => console.log("Rules clicked")}
                    style={{
                        position: "absolute",
                        top: "82%", // Настройте позицию
                        left: "50%", // Настройте позицию
                        transform: "translate(-50%, -50%) rotate(4deg)",
                        width: "75%", // 20% от ширины изображения
                        height: "8%", // 8% от высоты изображения
                        border: "none", //"2px solid green", // Временно видимая граница
                        background: "transparent", //"rgba(0, 255, 0, 0.3)", // Временно видимый фон
                        cursor: "pointer",
                        fontSize: "clamp(12px, 3vw, 64px)",
                        fontWeight: "bold",
                        color: "#8B0000",
                        fontFamily: "Pirata One, cursive",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                        zIndex: 4,
                        
                        display: "flex",
                        alignItems: "flex-end",      /* Позиционируем от низа */
                        justifyContent: "center",    /* Горизонтальное центрирование */
                        paddingBottom: "3%",  
                    }}
                >
                    Rules
                </button>

                <button
                    onClick={() => console.log("Credits clicked")}
                    style={{
                        position: "absolute",
                        top: "95%", // Настройте позицию
                        left: "50%", // Настройте позицию
                        transform: "translate(-50%, -50%) rotate(4deg)",
                        width: "75%", // 20% от ширины изображения
                        height: "8%", // 8% от высоты изображения
                        border: "none", //"2px solid green", // Временно видимая граница
                        background: "transparent", //"rgba(0, 255, 0, 0.3)", // Временно видимый фон
                        cursor: "pointer",
                        fontSize: "clamp(12px, 3vw, 64px)",
                        fontWeight: "bold",
                        color: "#8B0000",
                        fontFamily: "Pirata One, cursive",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                        zIndex: 4,
                        
                        display: "flex",
                        alignItems: "flex-end",      /* Позиционируем от низа */
                        justifyContent: "center",    /* Горизонтальное центрирование */
                        paddingBottom: "3%",  
                    }}
                >
                    Credits
                </button>
                
            </div>
        </div>
    );
};

export default MainMenu; 