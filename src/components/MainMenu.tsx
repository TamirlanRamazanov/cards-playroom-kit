import React from 'react';

interface MainMenuProps {
    onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
    return (
        <div style={{
            minHeight: "100vh",
            width: "100vw",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            background: "#0b1020",
            color: "#fff",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: -1
                }}
            >
                <source src="/videos/background.mp4" type="video/mp4" />
            </video>

            {/* UI Overlay */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.3)",
                zIndex: 1
            }} />

            {/* Main Content */}
            <div style={{
                position: "relative",
                zIndex: 2,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px"
            }}>
                {/* Game Title */}
                <h1 style={{
                    fontSize: "clamp(3rem, 8vw, 6rem)",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "2rem",
                    color: "#FFD700",
                    textShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
                    transform: "rotate(-2deg)"
                }}>
                    🎮 PLAYROOM GAME
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: "clamp(1rem, 3vw, 1.5rem)",
                    textAlign: "center",
                    marginBottom: "3rem",
                    color: "#fff",
                    opacity: 0.9
                }}>
                    Многопользовательская карточная игра
                </p>

                {/* Action Buttons */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    alignItems: "center"
                }}>
                    <button
                        onClick={onStartGame}
                        style={{
                            padding: "1rem 3rem",
                            fontSize: "clamp(1.2rem, 4vw, 1.8rem)",
                            fontWeight: "bold",
                            background: "linear-gradient(135deg, #8B0000 0%, #DC143C 100%)",
                            border: "none",
                            borderRadius: "50px",
                            color: "#fff",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            boxShadow: "0 4px 15px rgba(139, 0, 0, 0.4)",
                            transform: "rotate(1deg)"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = "rotate(1deg) scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 0, 0, 0.6)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = "rotate(1deg) scale(1)";
                            e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 0, 0, 0.4)";
                        }}
                    >
                        🚀 НАЧАТЬ ИГРУ
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                position: "relative",
                zIndex: 2,
                padding: "1rem",
                textAlign: "center",
                color: "#fff",
                opacity: 0.7,
                fontSize: "0.9rem"
            }}>
                <p>© 2024 Playroom Game. Все права защищены.</p>
            </div>
        </div>
    );
};

export default MainMenu; 