import { SlideSwipingUpActionerBucket } from "./SlideSwipingUpActionerBucket";
import { SlideSwipingUpActioner } from "./SlideSwipingUpActioner";
import { CURSOR_GRABBING_CLASS_NAME } from "../../../../constants/classes-names";

const fsLightbox = {
    core: {
        lightboxCloser: { close: jest.fn() },
        swipingActioner: { runTopActionsForProps: jest.fn() }
    },
    elements: {
        container: { classList: { remove: jest.fn() }, removeChild: jest.fn(), contains: jest.fn(() => false) },
        slideSwipingHoverer: 'slide-swiping-hoverer'
    },
    resolve: (constructorDependency) => {
        if (constructorDependency === SlideSwipingUpActionerBucket) {
            return slideSwipingUpActionsBucket;
        } else {
            throw new Error('Invalid dependency');
        }
    },
    slideSwipingProps: { isSourceDownEventTarget: true, swipedX: 1 },
    stageIndexes: {}
};
const slideSwipingUpActionsBucket = {
    runPositiveSwipedXActions: jest.fn(),
    runNegativeSwipedXActions: jest.fn(),
    runZoomSwipeActions: jest.fn()
};
const slideSwipingUpActions = new SlideSwipingUpActioner(fsLightbox);

test('resetSwiping', () => {
    slideSwipingUpActions.runNoSwipeActions();
    expect(fsLightbox.core.lightboxCloser.close).not.toBeCalled();
    expect(fsLightbox.slideSwipingProps.isSwiping).toBe(false);
    fsLightbox.slideSwipingProps.isSourceDownEventTarget = false;
    slideSwipingUpActions.runNoSwipeActions();
    expect(fsLightbox.core.lightboxCloser.close).toBeCalled();
});

test('runActions', () => {
    slideSwipingUpActions.runActions();
    expect(slideSwipingUpActionsBucket.runPositiveSwipedXActions).toBeCalled();
    expect(slideSwipingUpActionsBucket.runNegativeSwipedXActions).not.toBeCalled();
    expect(fsLightbox.elements.container.contains).toBeCalledWith('slide-swiping-hoverer');
    expect(fsLightbox.elements.container.removeChild).not.toBeCalled();
    expect(fsLightbox.elements.container.classList.remove).toBeCalledWith(CURSOR_GRABBING_CLASS_NAME);
    expect(fsLightbox.slideSwipingProps.isSwiping).toBe(false);

    fsLightbox.slideSwipingProps.swipedX = -1;
    fsLightbox.elements.container.contains = () => true;
    slideSwipingUpActions.runActions();
    expect(slideSwipingUpActionsBucket.runPositiveSwipedXActions).toBeCalledTimes(1);
    expect(slideSwipingUpActionsBucket.runNegativeSwipedXActions).toBeCalled();
    expect(fsLightbox.elements.container.removeChild).toBeCalledWith('slide-swiping-hoverer');
});
