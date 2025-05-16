        {[...Array(1001).keys()].map((i) => {
          const pos = (i - 500) * GRID_SIZE;
          return (
            <Group key={`grid-group-${i}`}>
              <Line points={[pos, -100000, pos, 100000]} stroke="#eee" strokeWidth={1} />
              <Line points={[-100000, pos, 100000, pos]} stroke="#eee" strokeWidth={1} />
            </Group>
          );
        })}

        {getVerdiepData(verdieping).rooms.map((room, i) => (
          <React.Fragment key={i}>
            {room.map((cell, j) => (
              <Rect
                key={j}
                x={cell.x - GRID_SIZE / 2 - 1}
                y={cell.y - GRID_SIZE / 2 - 1}
                width={GRID_SIZE + 2}
                height={GRID_SIZE + 2}
                fill="#aad7ff"
              />
            ))}
            <Text
              text={`Ruimte ${i + 1}`}
              x={room[0].x - 25}
              y={room[0].y - 10}
              fontSize={14}
              fill="#0077ff"
            />
          </React.Fragment>
        ))}

        {[...getFootprintWalls(), ...getInteriorWalls()].map((wall, index) => {
          const dx = wall.x2 - wall.x1;
          const dy = wall.y2 - wall.y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len;
          const uy = dy / len;
          const x1 = wall.x1 - ux * WALL_OVERSHOOT;
          const y1 = wall.y1 - uy * WALL_OVERSHOOT;
          const x2 = wall.x2 + ux * WALL_OVERSHOOT;
          const y2 = wall.y2 + uy * WALL_OVERSHOOT;
          const midX = (wall.x1 + wall.x2) / 2;
          const midY = (wall.y1 + wall.y2) / 2;

          return (
            <Group key={`wall-${index}`}>
              <Line
                points={[x1, y1, x2, y2]}
                stroke={selectedWallIndex === index ? "#0077ff" : "black"}
                strokeWidth={WALL_THICKNESS}
                onClick={() => setSelectedWallIndex(index)}
              />
              <Text
                text={`${wall.length} m`}
                x={midX + 20}
                y={midY -30}
                fontSize={15}
                fill="#666"
              />
            </Group>
          );
        })}

        {drawingWall && mousePos && (
          <Line
            points={[drawingWall.x1, drawingWall.y1, drawingWall.x2, drawingWall.y2]}
            stroke="#aaa"
            strokeWidth={2}
            dash={[4, 4]}
          />
        )}

        {getVerdiepData(verdieping).windows.map((win, i) => (
          <React.Fragment key={`win-${i}`}>
            <Line
              points={[win.x1, win.y1, win.x2, win.y2]}
              stroke="blue"
              strokeWidth={WALL_THICKNESS}
            />
            <Text
              x={(win.x1 + win.x2) / 2-30}
              y={(win.y1 + win.y2) / 2 +30}
              fontSize={15}
              text={win.ruimte ? '  ' + win.ruimte : ''}
              fill="blue"
              align="center"

            />
          </React.Fragment>
        ))}

        {getVerdiepData(verdieping).doors.map((door, i) => (
          <React.Fragment key={`door-${i}`}>
            <Line
              points={[door.x1, door.y1, door.x2, door.y2]}
              stroke="red"
              strokeWidth={WALL_THICKNESS}
            />
            <Text
              x={(door.x1 + door.x2) / 2 -20}
              y={(door.y1 + door.y2) / 2 + 12}
              fontSize={15}
              text={door.ruimte ? '  ' + door.ruimte : ''}
              fill="red"
              allign="center"
            />
          </React.Fragment>
        ))}
