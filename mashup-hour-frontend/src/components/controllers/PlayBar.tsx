import { useCallback, useEffect, useRef, useState } from "react"
import { Player } from "../player";
import Tooltip from "./Tooltip";
import { clamp } from "../util";
import "./styles/controllers.css"

interface PlayBarProps {
    player: Player,
}

enum PlayBarDraggable {
    START,
    END,
    SEEK,
}

const posWidth = 16;
const boundWidth = 10;

const PlayBar: React.FC<PlayBarProps> = ({ player }) => {
    const totalDuration = player.totalDuration();
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [seekPercentage, setSeekPercentage] = useState<number>(0);
    const [startPercentage, setStartPercentage] = useState<number>(0);
    const [endPercentage, setEndPercentage] = useState<number>(1);
    const [dragging, setDragging] = useState<PlayBarDraggable | null>(null);
    const [isRightClick, setIsRightClick] = useState<boolean>(false);
    const sliderRef = useRef<HTMLDivElement | null>(null);

    // track the players position, WIP I guess this might take a miracle to do accurately
    // useEffect(() => {
    //     const updatePlayPos = () => {
    //     }
    // })

    const stopDrag = () => {
        setDragging(null);
        document.body.classList.remove("sliding");
        document.body.classList.remove("pointing");
    }

    const startDrag = (e: React.MouseEvent, draggable: PlayBarDraggable) => {
        setDragging(draggable);
        setIsRightClick(e.button === 2);
        if (draggable !== PlayBarDraggable.SEEK) {
            document.body.classList.add("sliding");
        } else {
            document.body.classList.add("pointing");
        }
    }

    const onMouseEnter = () => {
        setIsHovering(true);
    }

    const onMouseLeave = () => {
        setIsHovering(false);
    }

    const onDrag = useCallback((e: MouseEvent) => {
        if (dragging !== null) {
            const rect = sliderRef.current?.getBoundingClientRect();
            if (rect !== undefined) {
                const sliderWidth = rect.width;
                const mousePos = clamp(0, sliderWidth, e.clientX - rect.left);
                const newPercentage = mousePos / sliderWidth

                if (dragging === PlayBarDraggable.SEEK) {
                    setSeekPercentage(newPercentage);
                } else if (isRightClick) {
                    const d = (dragging === PlayBarDraggable.END ? endPercentage : startPercentage) - newPercentage;
                    const newEndPercentage = endPercentage - d;
                    const newStartPercentage = startPercentage - d;
                    if (newEndPercentage >= 0 && newEndPercentage <= 1 && newStartPercentage >= 0 && newStartPercentage <= 1) {
                        setEndPercentage(newEndPercentage);
                        setStartPercentage(newStartPercentage);
                        player.setBounds(newStartPercentage * totalDuration, newEndPercentage * totalDuration);
                    }
                } else if (dragging === PlayBarDraggable.END && newPercentage > startPercentage) {
                    player.setEnd(newPercentage * totalDuration);
                    setEndPercentage(newPercentage);
                } else if (dragging === PlayBarDraggable.START && newPercentage < endPercentage) {
                    player.setStart(newPercentage * totalDuration);
                    setStartPercentage(newPercentage);
                }
            }
        }
    }, [dragging, totalDuration, endPercentage, startPercentage, player, isRightClick]);

    useEffect(() => {
        if (dragging !== null) {
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        } else {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        }

        // remove event listeners when component unmounts
        return () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        };
    }, [dragging, onDrag]);



    return (
        <div
            ref={sliderRef}
            className="playbar"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                backgroundImage: `linear-gradient(to right, #121212 0%, #121212 ${startPercentage * 100}%, transparent ${startPercentage * 100}%, transparent ${endPercentage * 100}%, #121212 ${endPercentage * 100}%, #121212 100%)`,
            }}
        >
            {(isHovering || dragging !== null) && (
                <Tooltip text="seek" showCondition={dragging === null} style={{
                    left: `${seekPercentage * 100}%`,
                    position: "absolute",
                }}>
                    <div className="playbar-pos"
                        style={{
                            width: `${posWidth}px`,
                            height: `${posWidth}px`,
                            transform: `${dragging === PlayBarDraggable.SEEK ? "scale(var(--scale-increase))" : ""}`
                        }}
                        onMouseDown={(e) => startDrag(e, PlayBarDraggable.SEEK)}
                    ></div>
                </Tooltip>
            )
            }
            <Tooltip text="start" showCondition={dragging === null} style={{
                left: `${startPercentage * 100}%`,
                top: "6px",
                position: "absolute",
            }}>
                <div
                    className="playbar-bound"
                    style={{
                        backgroundColor: 'green',
                        width: `${boundWidth}px`,
                        height: `${posWidth / 2}px`,
                        transform: `${dragging === PlayBarDraggable.START ? "scale(var(--scale-increase))" : ""}`
                    }}
                    onMouseDown={(e) => startDrag(e, PlayBarDraggable.START)}
                ></div>
            </Tooltip>
            <Tooltip text="end" showCondition={dragging === null} style={{
                left: `${endPercentage * 100}%`,
                top: "-6px",
                position: "absolute",
            }}>
                <div
                    className="playbar-bound"
                    style={{
                        backgroundColor: 'red',
                        width: `${boundWidth}px`,
                        height: `${posWidth / 2}px`,
                        transform: `${dragging === PlayBarDraggable.END ? "scale(var(--scale-increase))" : ""}`
                    }}
                    onMouseDown={(e) => startDrag(e, PlayBarDraggable.END)}
                ></div>
            </Tooltip>

            {/* <div
                playbar if I ever figure out how to do it accurately
            /> */}
        </div >
    );
}
export default PlayBar