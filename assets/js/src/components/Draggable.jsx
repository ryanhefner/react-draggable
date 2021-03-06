import React from 'react';
import PropTypes from 'prop-types';

class Draggable extends React.Component {
  constructor(props) {
    super(props);

    // if the component drag should take place
    this.doDrag = true;

    // initial state object
    this.state = {
      pos: this.props.position || { x: 0, y: 0 },
      dragging: false,
      elementStyle: {
        position: this.props.cssPosition || 'absolute',
      },
      checkTimerStarted: false,
      scrollLocked: false,
      dragLocked: false,
      dragStartInputPos: {
        x: 0,
        y: 0,
      },
      dragStartElementPos: {
        x: 0,
        y: 0,
      },
    };


    // bind functions to component
    this.renderChild = this.renderChild.bind(this);
    this.setPosition = this.setPosition.bind(this);
    this.positionContent = this.positionContent.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragStop = this.onDragStop.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
  }


  /**
   * Called before component mounts to DOM
   * @returns {undefined} undefined
   */
  componentWillMount() {
    if (this.props.position) {
      this.positionContent();
    }
  }


  /**
   * Called after component mounts to DOM
   * @returns {undefined} undefined
   */
  componentDidMount() {
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('touchmove', this.onDrag);
    document.addEventListener('mouseup', this.onDragStop);
    document.addEventListener('touchend', this.onDragStop);
  }


  /**
   * Called when component updates
   * @returns {undefined} undefined
   */
  componentDidUpdate(prevProps) {
    const position = this.props.position;

    if (position &&
      (!prevProps.position ||
      (prevProps.position &&
      ((position.x !== prevProps.position.x) ||
      (position.y !== prevProps.position.y))))) {
      this.setPosition({ x: position.x, y: position.y });
    }
  }


  /**
   * Called before component is removed from the DOM
   * @returns {undefined} undefined
   */
  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('touchmove', this.onDrag);
    document.removeEventListener('mouseup', this.onDragStop);
    document.removeEventListener('touchend', this.onDragStop);
  }


  /**
   * Renders component
   * @returns {Object} React element
   */
  render() {
    const classNameProp = this.props.className || '';
    const className = `component-draggable ${classNameProp}`;
    const children = this.renderChild();

    return (
      <div
        className={className}
        onTouchStart={this.onDragStart}
        onTouchCancel={this.onDragLeave}
        onMouseDown={this.onDragStart}
        onDragLeave={this.onDragLeave}
      >
        {children}
      </div>
    );
  }


  /**
   * Renders the child element
   * @returns {Object} React element
   */
  renderChild() {
    const inst = this;

    return React.Children.map(this.props.children, (child) => {
      let newStyle = {};
      let childStyle = {};
      let elementStyle = {};

      if (child.props && child.props.style) {
        childStyle = child.props.style;
      }

      if (inst.state && inst.state.elementStyle) {
        elementStyle = inst.state.elementStyle;
      }

      newStyle = Object.assign(childStyle, elementStyle, this.props.style);

      return React.cloneElement(child, {
        style: newStyle,
        ref: 'draggableChild',
      });
    });
  }


  /**
   * Positions the draggable element
   * @param {Object} pos - An object with x and y position values
   * @returns {undefined} undefined
   */
  setPosition(pos) {
    this.setState({
      pos,
    }, this.positionContent);
  }


  /**
   * If the 'touchScrollLock' prop is set to true, and dragging is locked
   * to the 'x' or 'y' axis, and the user is dragging
   * (or scrolling on mobile) on the opposite axis, stop any dragging.
   * This is so the content doesn't move when a user is scrolling on a
   * mobile device.
   * @param {Number} pageX - The x position of mouse or touch event
   * @param {Number} pageY - The y position of mouse or touch event
   * @returns {undefined} undefined
   */
  setScrollLock(pageX, pageY) {
    let difX = 0;
    let difY = 0;

    if (this.props.touchScrollLock && (this.props.lock === 'x' ||
      this.props.lock === 'y')) {
      difY = (pageY - this.state.pos.y);
      difX = (pageX - this.state.pos.x);

      if (difY < 0) {
        difY *= -1;
      }

      if (difX < 0) {
        difX *= -1;
      }

      if (this.props.lock === 'x') {
        // if the content is locked to dragging horizontally
        if (difX > difY) {
          // if the user is intending to swipe horizontally
          if (difX > 10 && !this.state.scrollLocked) {
            this.doDrag = true;
            this.setState({ dragLocked: true });
          }
        } else {
          // if the user is intending to swipe vertically
          if (!this.state.dragLocked) {
            this.setState({ scrollLocked: true });
          }
        }
      } else {
        // if the content is locked to dragging vertically
        if (difY > difX) {
          // if the user is intending to swipe vertically
          if (difY > 10 && !this.state.scrollLocked) {
            this.doDrag = true;
            this.setState({ dragLocked: true });
          }
        } else {
          // if the user is intending to swipe horizontally
          if (!this.state.dragLocked) {
            this.setState({ scrollLocked: true });
          }
        }
      }
    }
  }


  /**
   * Gets the updated position values
   * @param {Number} pageX - The x position of mouse or touch event
   * @param {Number} pageY - The y position of mouse or touch event
   * @returns {Object} The x and y coordinates to move the content to
   */
  getNewPosition(pageX, pageY) {
    const newPos = {
      x: this.state.dragStartElementPos.x +
        (pageX - this.state.dragStartInputPos.x),
      y: this.state.dragStartElementPos.y +
        (pageY - this.state.dragStartInputPos.y),
    };

    if (this.props.bounds) {
      // if the bounds were supplied, don't let the content move outside
      // of them
      const bounds = this.props.bounds;

      if (newPos.x < bounds.x1) {
        newPos.x = bounds.x1;
      }

      if (newPos.y < bounds.y1) {
        newPos.y = bounds.y1;
      }

      if (newPos.x > bounds.x2) {
        newPos.x = bounds.x2;
      }

      if (newPos.y > bounds.y2) {
        newPos.y = bounds.y3;
      }
    }

    if (this.props.lock === 'x') {
      newPos.y = this.state.dragStartElementPos.y;
    }

    if (this.props.lock === 'y') {
      newPos.x = this.state.dragStartElementPos.x;
    }

    return newPos;
  }


  /**
   * Positions the draggable element
   * @returns {undefined} undefined
   */
  positionContent() {
    const xPos = `${this.state.pos.x}px`;
    const yPos = `${this.state.pos.y}px`;
    const positionTransformString = `translate3d(${xPos},${yPos}, 0px)`;
    const transformStyle = {
      msTransform: positionTransformString,
      WebkitTransform: positionTransformString,
      MozTransform: positionTransformString,
      transform: positionTransformString,
    };
    const newStyle = Object.assign(this.state.elementStyle, transformStyle);

    this.setState({
      elementStyle: newStyle,
    }, () => {
      // allow the component to be dragged again because all values have been
      // updated through the React lifecycle
      this.doDrag = true;
    });
  }


  /**
   * Called when the user's mouse is pressed
   * @param {Event} e A mousedown event
   * @returns {undefined} undefined
   */
  onDragStart(e) {
    this.mouseDownOnElement = true;

    if (!this.props.disabled) {
      let pageX = e.clientX;
      let pageY = e.clientY;

      if (e.type !== 'mousedown') {
        pageX = e.changedTouches[0].clientX;
        pageY = e.changedTouches[0].clientY;
      }

      this.mouseDownWhileDisabled = false;

      this.setState({
        scrollLocked: false,
        checkTimerStarted: true,
        dragStartInputPos: {
          x: pageX,
          y: pageY,
        },
        dragStartElementPos: {
          x: this.state.pos.x,
          y: this.state.pos.y,
        },
      });

      if (this.props.dragStartCallback) {
        this.props.dragStartCallback(this.state.pos, e.target);
      }

      if (this.props.preventDefaultEvents) {
        e.stopPropagation();
        e.preventDefault();
      }
    } else {
      this.mouseDownWhileDisabled = true;
    }
  }


  /**
   * Called when the user's mouse is moved
   * @param {Event} e A mousemove event
   * @returns {undefined} undefined
   */
  onDrag(e) {
    if (this.mouseDownOnElement && !this.props.disabled) {
      let pageX = e.clientX;
      let pageY = e.clientY;

      if (e.type !== 'mousemove') {
        pageX = e.changedTouches[0].clientX;
        pageY = e.changedTouches[0].clientY;
      }

      this.setScrollLock(pageX, pageY);

      if (this.doDrag && !this.state.scrollLocked) {
        this.doDrag = false;

        const newPos = this.getNewPosition(pageX, pageY);

        this.setState({
          dragging: true,
          pos: newPos,
        }, () => {
          this.positionContent();
        });

        if (this.props.dragCallback) {
          this.props.dragCallback(newPos, event.target);
        }
      }
    }

    if (this.props.preventDefaultEvents) {
      e.stopPropagation();
      e.preventDefault();
    }
  }


  /**
   * Called when the user's mouse is released
   * @param {Event} e A mouseup event
   * @returns {undefined} undefined
   */
  onDragStop(e) {
    if (this.mouseDownOnElement &&
      !this.props.disabled &&
      !this.mouseDownWhileDisabled) {
      if (this.props.dragStopCallback && !this.state.scrollLocked) {
        this.props.dragStopCallback({
          x: this.state.pos.x,
          y: this.state.pos.y,
        }, e.target);
      }

      this.setState({
        dragging: false,
        scrollLocked: false,
        dragLocked: false,
      });

      if (this.props.preventDefaultEvents) {
        e.stopPropagation();
        e.preventDefault();
      }
    }

    this.mouseDownOnElement = false;
  }


  /**
   * Called when the user is dragging but releases the mouse
   * outside of the draggable component
   * @returns {undefined} undefined
   */
  onDragLeave() {
    if (this.state.dragging) {
      this.setState({
        scrollLocked: false,
        dragLocked: false,
      });

      if (this.props.dragLeaveCallback) {
        this.props.dragLeaveCallback();
      }
    }
  }
}


/**
 * Expected propTypes
 * @prop {Object} bounds - An array of coordinates, forming a square, that the
 * user cannot drag the component outside of
 * @prop {Object} children - Child React elements
 * @prop {String} className - A string of additional classnames to add
 * to the element
 * @prop {String} cssPosition - The css positioning for for the element
 * (i.e. 'absolute' or 'fixed', defaults to 'absolute')
 * @prop {Boolean} disabled - If the component is disabled
 * @prop {Function} dragCallback - A callback function while the user is
 * dragging
 * @prop {Function} dragStartCallback - A callback function for when the user
 * stops dragging
 * @prop {Function} dragStopCallback - A callback function for when the user
 * stops dragging
 * @prop {Function} dragLeaveCallback - A callback function for when the user
 * is dragging and the mouse/touch leaves the draggable component
 * @prop {String} lock - An axis to lock element to when dragging, either
 * 'x' or 'y'
 * @prop {Boolean} preventDefaultEvents - Whether to prevent default
 * mouse/touch events
 * @prop {Object} style - A style object
 * @prop {String} touchScrollLock - If set to true, prevents the content from
 * being dragged if the user is scrolling in the opposite direction on a touch
 * device
 */
Draggable.propTypes = {
  bounds: PropTypes.shape({
    x1: PropTypes.number.isRequired,
    y1: PropTypes.number.isRequired,
    x2: PropTypes.number.isRequired,
    y2: PropTypes.number.isRequired,
  }),
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
  ]).isRequired,
  className: PropTypes.string,
  cssPosition: PropTypes.string,
  disabled: PropTypes.bool,
  dragCallback: PropTypes.func,
  dragLeaveCallback: PropTypes.func,
  dragStartCallback: PropTypes.func,
  dragStopCallback: PropTypes.func,
  lock: PropTypes.string,
  position: PropTypes.object,
  preventDefaultEvents: PropTypes.bool,
  style: PropTypes.object,
  touchScrollLock: PropTypes.bool,
};


export default Draggable;
