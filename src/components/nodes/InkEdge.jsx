import { memo } from 'react';
import { BaseEdge, getSmoothStepPath } from '@xyflow/react';

function InkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: 'var(--color-ink-black)',
        strokeWidth: 3,
        strokeLinecap: 'square',
        ...style,
      }}
      className="ink-draw-animation"
      id={id}
    />
  );
}

export default memo(InkEdge);
