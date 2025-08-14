export interface DragDropContextProps {
  onDragEnd: (result: DragResult) => void;
  children: React.ReactNode;
}

export interface DroppableProps {
  droppableId: string;
  children: (provided: DroppableProvided) => React.ReactNode;
}

export interface DraggableProps {
  draggableId: string;
  index: number;
  children: (
    provided: DraggableProvided,
    snapshot: DraggableSnapshot
  ) => React.ReactNode;
}

export interface DragResult {
  draggableId: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}

export interface DroppableProvided {
  innerRef: React.RefObject<HTMLElement>;
  droppableProps: {
    'data-droppable-id': string;
  };
  placeholder: React.ReactNode;
}

export interface DraggableProvided {
  innerRef: React.RefObject<HTMLElement>;
  draggableProps: {
    'data-draggable-id': string;
    'data-index': number;
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
}

export interface DraggableSnapshot {
  isDragging: boolean;
  isDropAnimating: boolean;
}

// Global drag state
let dragState: {
  draggableId: string | null;
  sourceDroppableId: string | null;
  sourceIndex: number | null;
  dragElement: HTMLElement | null;
  placeholder: HTMLElement | null;
  onDragEnd: ((result: DragResult) => void) | null;
} = {
  draggableId: null,
  sourceDroppableId: null,
  sourceIndex: null,
  dragElement: null,
  placeholder: null,
  onDragEnd: null,
};

// Utility functions
const createPlaceholder = (element: HTMLElement): HTMLElement => {
  const placeholder = element.cloneNode(true) as HTMLElement;
  placeholder.style.opacity = '0.5';
  placeholder.style.pointerEvents = 'none';
  placeholder.setAttribute('data-placeholder', 'true');
  return placeholder;
};

const getDroppableElement = (element: HTMLElement): HTMLElement | null => {
  let current = element;
  while (current && current !== document.body) {
    if (current.hasAttribute('data-droppable-id')) {
      return current;
    }
    current = current.parentElement!;
  }
  return null;
};

const getDraggableElements = (droppable: HTMLElement): HTMLElement[] => {
  return Array.from(droppable.querySelectorAll('[data-draggable-id]')).filter(
    (el) => !el.hasAttribute('data-placeholder')
  ) as HTMLElement[];
};

const getInsertionIndex = (droppable: HTMLElement, clientY: number): number => {
  const draggables = getDraggableElements(droppable);
  for (let i = 0; i < draggables.length; i++) {
    const rect = draggables[i].getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    if (clientY < middle) {
      return i;
    }
  }
  return draggables.length;
};

// Event handlers
const handleDragStart = (
  e: DragEvent,
  draggableId: string,
  index: number,
  droppableId: string
) => {
  const element = e.target as HTMLElement;
  dragState.draggableId = draggableId;
  dragState.sourceDroppableId = droppableId;
  dragState.sourceIndex = index;
  dragState.dragElement = element;

  // Create and insert placeholder
  const placeholder = createPlaceholder(element);
  dragState.placeholder = placeholder;
  element.parentNode?.insertBefore(placeholder, element.nextSibling);

  // Style the dragging element
  element.style.opacity = '0.8';
  element.style.transform = 'rotate(2deg)';

  // Set drag data
  e.dataTransfer?.setData('text/plain', draggableId);
  e.dataTransfer!.effectAllowed = 'move';
};

const handleDragEnd = (e: DragEvent) => {
  const element = e.target as HTMLElement;

  // Reset element styles
  element.style.opacity = '';
  element.style.transform = '';

  // Remove placeholder
  if (dragState.placeholder) {
    dragState.placeholder.remove();
  }

  // Reset drag state
  dragState = {
    draggableId: null,
    sourceDroppableId: null,
    sourceIndex: null,
    dragElement: null,
    placeholder: null,
    onDragEnd: null,
  };
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';

  const droppable = getDroppableElement(e.target as HTMLElement);
  if (!droppable || !dragState.placeholder) return;

  const insertionIndex = getInsertionIndex(droppable, e.clientY);
  const draggables = getDraggableElements(droppable);

  // Move placeholder to correct position
  if (insertionIndex >= draggables.length) {
    droppable.appendChild(dragState.placeholder);
  } else {
    droppable.insertBefore(dragState.placeholder, draggables[insertionIndex]);
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();

  const droppable = getDroppableElement(e.target as HTMLElement);
  if (!droppable || !dragState.draggableId || !dragState.onDragEnd) return;

  const droppableId = droppable.getAttribute('data-droppable-id')!;
  const finalIndex = getInsertionIndex(droppable, e.clientY);

  // Calculate the actual destination index (accounting for placeholder)
  let destinationIndex = finalIndex;
  if (
    droppableId === dragState.sourceDroppableId &&
    finalIndex > dragState.sourceIndex!
  ) {
    destinationIndex = finalIndex - 1;
  }

  const result: DragResult = {
    draggableId: dragState.draggableId,
    source: {
      droppableId: dragState.sourceDroppableId!,
      index: dragState.sourceIndex!,
    },
    destination: {
      droppableId,
      index: destinationIndex,
    },
  };

  dragState.onDragEnd(result);
};
