var whiteboardOffsetX;
var whiteboardOffsetY;
var curPath;
var selectRegion;
var curPointer;
var paths;
var drawMode;
var messageItem;
var isMouseDown;

var paperWb;
var paperSelect;
var paperWorking;
var toolWb;
var toolSelect;

// For touch draw
var touchId2Path;
var isTouchEnabled = true;
var isTouching = false;

// PointEvent Test
var statusMessage;

function whiteboardStart(wbCanvas, selectCanvas, workingCanvas) {

    paperWb = new paper.PaperScope();
    paperWb.setup(wbCanvas);
    /* paperWb���L�� */

    toolWb = new paper.Tool(); // paperWb�ɕR�Â�

    toolWb.onMouseDown = onWhiteboardMouseDown;
    toolWb.onMouseDrag = onWhiteboardMouseDrag;
    toolWb.onMouseUp = onWhiteboardMouseUp;

    paperSelect = new paper.PaperScope();
    paperSelect.setup(selectCanvas);
    /* paperSelect���L�� */

    toolSelect = new paper.Tool(); // paperSelect�ɕR�Â�

    toolSelect.onMouseDown = onWhiteboardMouseDown;
    toolSelect.onMouseDrag = onWhiteboardMouseDrag;
    toolSelect.onMouseUp = onWhiteboardMouseUp;
    //toolSelect.minDistance = 2;
    //toolSelect.maxDistance = 2;

    paperWorking = new paper.PaperScope();
    paperWorking.setup(workingCanvas);
    paperWorking.project.activeLayer.visible = false;
    /* paperWorking���L�� */
    /* paperWorking�͎g���Ă��Ȃ� */

    paperWb.activate();
    /* paperWb���L�� */

    isMouseDown = false;
    paths = new Array();
    drawMode = "Draw";
    messageItem = new paper.PointText({
        content: 'Click and drag to draw a line.',
        point: new paper.Point(20, 30),
        fillColor: 'black'
    });

    statusMessage = new paper.PointText({
        content: 'Touch IDs',
        point: new paper.Point(20, 50),
        fillColor: 'red'
    });
}

// onWhiteboardTouchStart()���onWhiteboardMouseDown()�̕�����ɌĂ΂�悤���i�u���E�U�ˑ��̉\������j
function onWhiteboardTouchStart(ev) {
    if (!isTouchEnabled) {
        return;
    }
    
    if ("Draw" == drawMode) {
        paperWb.project.deselectAll();
        paperSelect.project.clear(); // �O�̂��ߑS������

        paperWb.activate();
        if (curPath) {
            //onWhiteboardMouseDown()����ɌĂ΂�ē_���`�悳���̂ŏ���(��������Down�C�x���g�ŕ`�悵�Ȃ��Ă悢����)
            curPath.remove();
            curPath = null;
        }

        if (touchId2Path == null) {
            touchId2Path = new Object();
        }

        let touches = ev.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            let point = paperWb.view.getEventPoint(touches[i]);
            let path = new paper.Path({
                segments: [point],
                strokeColor: 'red',
                strokeWidth: 5,
                fullySelected: false,
                visible: true
            });
            touchId2Path[touches[i].identifier] = path;
        }
        isTouching = true;
        console.log(touches);
    }
    
    
}

function onWhiteboardTouchMove(ev) {
    if (!isTouchEnabled || !isTouching) {
        return;
    }

    if (touchId2Path) {
        let touches = ev.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            let path = touchId2Path[touches[i].identifier];
            let point = paperWb.view.getEventPoint(touches[i]);
            path.add(point);
            paperWb.view.draw();
        }
    }
 
}

// onWhiteboardMouseUp()���onWhiteboardTouchEnd()�̕�����ɌĂ΂�悤���i�u���E�U�ˑ��̉\������j
function onWhiteboardTouchEnd(ev) {
    if (!isTouchEnabled || !isTouching) {
        return;
    }

    let touches = ev.changedTouches;

    for (let i = 0; i < touches.length; i++) {
        let path = touchId2Path[touches[i].identifier];
        paths.push(path);
        delete touchId2Path[touches[i].identifier];
    }  

    if (ev.touches.length == 0) {
        touchId2Path = null;
        isTouching = false;// �w���S�����ꂽ��^�b�`�I��
    }

}

function onWhiteboardMouseDown(event) {

    console.log("onWhiteboardMouseDown");

    // onWhiteboardTouchStart()���onWhiteboardMouseDown()�̕�����ɌĂ΂�悤���i�u���E�U�ˑ��̉\������j
    // �Ȃ̂�onWhiteboardMouseDown()�œ_���`�悳��Ă��܂���onWhiteboardTouchStart()�ŏ����B
    if (isTouching) {
        return;
    }

    // �I����Ԃ�����
    paperWb.project.deselectAll();
    paperSelect.project.clear(); // �O�̂��ߑS������

    if ("Draw" == drawMode) {
        paperWb.activate();
        curPath = new paper.Path({
            segments: [event.point],
            strokeColor: 'black',
            strokeWidth: 1,
            fullySelected: false,
            visible: true
        });
        // �N���b�N�̏ꍇ�ɓ_���c��
    } else if ("EraseByStroke" == drawMode || "EraseByPoint" == drawMode || "EraseByBigPoint" == drawMode) {
        paperSelect.activate();
        curPath = new paper.Path({
            segments: [event.point],
            strokeColor: '#0000FF',
            strokeWidth: 6,
            fullySelected: false,
            visible: true
        });
        curPath.opacity = 0.2;
        curPointer = new paper.Path.Circle({
            center: event.point,
            radius: ("EraseByBigPoint" == drawMode ? 40 : 3),
            fillColor: '#0000FF',
            strokeWidth: 1
        });
        curPointer.opacity = 0.2;

    } else if ("SelectByDrag" == drawMode) {
        paperSelect.activate();
        curPath = new paper.Path({
            segments: [event.point],
            strokeColor: '#FFA500',
            strokeWidth: 3,
            fullySelected: false,
            visible: true
        });
        curPath.opacity = 0.7;
        curPath.dashArray = [10, 4];

        selectRegion = new paper.Path({
            segments: [event.point],
            strokeColor: '#010000',
            strokeWidth: 1,
            fullySelected: false,
            visible: false,
            closed: true
        });

    } else if ("SelectByPoint" == drawMode) {
        paperSelect.activate();
        curPath = null;
        let hitResult = paperWb.project.hitTest(event.point); //�_���ƑI�����ɂ����̂�Rect��Circle�ɂ����ق����ǂ�
        if (hitResult != null) {
            hitResult.item.selected = true;
        }
    }


}

function onWhiteboardMouseDrag(event) {

    if (isTouching) {
        return;
    }

    if (curPath) {
        curPath.add(event.point);

        messageItem.content = 'Segment count: ' + curPath.segments.length;
    }

    if ("EraseByStroke" == drawMode) {
        curPointer.position = event.point;

        let newPaths;
        // paths����path�������̂�(index���ς��̂�)��납��p�[�X����
        for (let i = paths.length - 1; i >= 0; i--) {
            let isIntersect = false;
            isIntersect = curPath.intersects(paths[i]);
            if (isIntersect) {
                if (!newPaths) {
                    newPaths = paths.slice(0, paths.length);
                }
                paths[i].remove();
                newPaths.splice(i, 1);

            }
        }
        if (newPaths) {
            paths = newPaths;
        }

    } else if ("EraseByPoint" == drawMode || "EraseByBigPoint" == drawMode) {

        curPointer.position = event.point;
        let eraserPath = curPath;
        let eraserClip = curPointer;
        let newPaths;

        // paths����path�������̂�(index���ς��̂�)��납��p�[�X����
        for (let i = paths.length - 1; i >= 0; i--) {
            let isIntersect = false;

            /*
             * ������ �_���� ������
             * 1.��{��eraserPath�ɂ���_������
             * 2.1�������ƕ������ꂽ�S�~���c����eraserPath�̌����ł͏����ɂ����̂ŁAeraserClip�Ɋ܂܂��p�X������Ώ���
             * 3.1,2�������ƃX�g���[�N����Ȃ����ď����Â炢(eraserPath���������Ȃ��̂ŏ����Ȃ��AeraserClip���}�E�X���W����Ԃ�eraserClip�Ɋ܂܂�Ȃ��������c��)
             * 4.eraserClip��smallClip�̑傫���͓������炢���悢�BeraserClip�̂ق����傫���ƁA�������ď������Ƃ���"   -   "�̂悤�Ɏc�邱�Ƃ�����B
             * 
             * ������ �͈͏��� ������
             * 1.�_������1�͂��Ȃ��B��̂Ђ��z�肵�Ă���A��̂Ђ�������ňړ������Ƃ��ɃX�g���[�N���ׂ��؂�Ă���̂��ς�����B
             * 2.�Ō�ɐV�����ł����p�X��eraserClip���ɂ���Ώ����B�S�~���c��ɂ������邽�߁B
             */
              
            // eraserClip�ɂ������ieraserPath�������ƍׂ����������ꂽ�S�~�������ɂ����j
            if (isInRegion(paths[i], eraserClip)) {
                if (!newPaths) {
                    newPaths = paths.slice(0, paths.length);
                }
                paths[i].remove();
                newPaths.splice(i, 1);
            } else {
                // eraserPath�ɂ�����
                let eraser = eraserPath;
                if ("EraseByPoint" == drawMode){
                    isIntersect = eraserPath.intersects(paths[i]);
                }
                if (!isIntersect) {
                    // eraserPath�Ō�_���Ȃ������ꍇ�AeraserClip�Ō�_���`�F�b�N
                    isIntersect = eraserClip.intersects(paths[i]);
                    eraser = eraserClip;
                }
                if (isIntersect) {
                    let createdPaths = new Array();
                    eraseStrokeByPoint(paths[i], eraser, createdPaths);
                    if (createdPaths.length > 0) {
                        if (!newPaths) {
                            newPaths = paths.slice(0, paths.length);
                        }
                        paths[i].remove();
                        newPaths.splice(i, 1);
                        for (let j = 0; j < createdPaths.length; j++) {
                            if ("EraseByBigPoint" == drawMode && isInRegion(createdPaths[j], eraserClip)) {
                                // �V�������ꂽ�p�X��eraserPath���ł���Ώ���
                                createdPaths[j].remove();
                            }
                             else {
                                // newPaths��z-order�͂Ȃ����A���̃X�g���[�N�̏ꏊ�ɓ��ꂽ�ق����ǂ������i��X�̂��Ƃ��l�����āj
                                newPaths.push(createdPaths[j]);
                            }
                        }
                    }

                }
            }
        }
        if (newPaths) {
            paths = newPaths;
        }
        
    } else if ("SelectByDrag" == drawMode) {
        // �͈͑I��p�̃p�X�ƃq�b�g�e�X�g�p�̃p�X�𕪂���
        // �����ɂ��Ă��܂��Ɣ͈͑I��p�̃p�X��closed�ɂȂ��đI������Ƃ��Ɍ��ɂ���
        //curPath.closed = true;
        selectRegion.add(event.point); 
        // �}�E�X�A�b�v�̎��ɂ����ق����p�t�H�[�}���X��悢���낤
        for (let i = 0; i < paths.length; i++) {
            if (isInRegion(paths[i], selectRegion)) {
                paths[i].selected = true;
            } else {
                paths[i].selected = false;
            }
        }
    }
}


// When the mouse is released, we simplify the path:
function onWhiteboardMouseUp(event) {
    console.log("onWhiteboardMouseUp()");

    // onWhiteboardMouseUp()���onWhiteboardTouchEnd()�̕�����ɌĂ΂�悤���i�u���E�U�ˑ��̉\������j
    if (isTouching) {
        return;
    }

    if (curPath == null) {
        // �^�b�`�`�撆��curPath��null
        // onWhiteboardTouchEnd()�̌��onWhiteboardMouseUp()���Ă΂��ꍇ�̏���
        return; 
    }
    if ("Draw" == drawMode) {
        let segmentCount = curPath.segments.length;

        // When the mouse is released, simplify it:
        curPath.simplify(10);
        // curPath.flatten(0);

        // Select the path, so we can see its segments:
        curPath.fullySelected = true;

        let newSegmentCount = curPath.segments.length;
        let difference = segmentCount - newSegmentCount;
        let percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
        messageItem.content = difference + ' of the ' + segmentCount + ' segments were removed. Saving ' + percentage + '%';

        paths.push(curPath);
    } else if ("EraseByStroke" == drawMode || "EraseByPoint" == drawMode || "EraseByBigPoint" == drawMode) {
        curPath.remove();
        curPointer.remove();
    } else if ("SelectByDrag" == drawMode) {
        curPath.remove();
        selectRegion.remove();
    }

}

function changeDrawMode(mode) {
    drawMode = mode;
    if ("EraseByStroke" == drawMode) {
        //paperSelect.activate();
    } else if ("EraseByPoint" == drawMode) {
        //paperSelect.activate();
    } else if ("EraseByBigPoint" == drawMode) {
        //paperSelect.activate();
    } else if ("SelectByDrag" == drawMode) {
        //paperSelect.activate();
    } else if ("SelectByPoint" == drawMode) {
        //paperSelect.activate();
    } else {// Draw
        paperWb.activate();
    }
}


// �p�X�𕪊����Đ������ꂽ�p�X�͌��̃p�X���������K�w�ɂ���ׂ�
function eraseStrokeByPoint(orgPath, eraser, createdPaths) {

    var targetPath = orgPath.clone(); // �N���[�����̒���ɔz�u�����
    var curveLocs = targetPath.getIntersections(eraser);

    // ��_���Ȃ���ΏI��
    if (curveLocs.length == 0) {
        return;
    }

    var createdPath = targetPath.splitAt(curveLocs[0]);
    if (createdPath == null) {
        targetPath.remove();
        return;
    }

    //targetPath�̖��[��Z������
    var smallClip = getSmallClip(targetPath.lastSegment.point);
    curveLocs = targetPath.getIntersections(smallClip);
    if (curveLocs.length == 0) {
        // targetPath��smallClip���ɂ��锻�f����
        targetPath.remove();
    } else {
        let erasedPath = targetPath.splitAt(curveLocs[0]);
        if (erasedPath) {
            erasedPath.remove(); // ���[���폜
        }
        createdPaths.push(targetPath);
    }
    smallClip.remove();

    //createdPath�̐�[��Z������
    smallClip = getSmallClip(createdPath.firstSegment.point);
    curveLocs = createdPath.getIntersections(smallClip);
    if (curveLocs.length == 0) {
        // createdPath��smallClip���ɂ��锻�f����
        createdPath.remove();
    } else {
        let remainPath = createdPath.splitAt(curveLocs[0]);
        createdPath.remove(); // ��[���폜
        if (remainPath) {
            createdPaths.push(remainPath);
        }
    }
    smallClip.remove();

}
function getSmallClip(point) {
    let clip = new paper.Path.Circle({
        center: point,
        radius: 3,
        fillColor: '#100000',
        strokeWidth: 1
    });
    clip.visible = false;

    return clip;
}

function isInRegion(targetPath, regionPath) {
    if (targetPath.intersects(regionPath)) {
        return false;
    } else {
        return regionPath.contains(targetPath.firstSegment.point);
    }
}

//Sample 
var ongoingTouches = new Array(0);

function handleStart(evt) {
  console.log("pointerdown.");
  console.log("pointerdown: id = " + evt.pointerId);
  var randomColor = "rgb(" + (~~(256 * Math.random())) + ", " + (~~(256 * Math.random())) + ", " + (~~(256 * Math.random())) + ")" ;
  let point = paperWb.view.getEventPoint(evt);
  var strokeWidth = evt.pressure * 10;
  let path = new paper.Path({
      segments: [point],
      strokeColor: randomColor,
      strokeWidth: strokeWidth,
      fullySelected: false,
      visible: true
  });
  if (touchId2Path == null) {
    touchId2Path = new Object();
  }
  ongoingTouches.push(evt.pointerId);
  touchId2Path[evt.pointerId] = path;
} 


function handleMove(evt) {
    if (touchId2Path == null || touchId2Path[evt.pointerId] == null) {
        return;
    }
    console.log(evt);    
    statusMessage.content = `${ongoingTouches}`
    if (touchId2Path) {
        let path = touchId2Path[evt.pointerId];
        let point = paperWb.view.getEventPoint(evt);
        path.add(point);
        paperWb.view.draw();
    } else {
      console.log("can't figure out which touch to continue: idx = " + idx);
    }
} 

function handleEnd(evt) {
    console.log("pointerup");
    if (touchId2Path) {
            let path = touchId2Path[evt.pointerId];
            paths.push(path);
            delete touchId2Path[evt.pointerId];
    } else {
      log("can't figure out which touch to end");
    }
    console.log(touchId2Path);
    if (Object.keys(touchId2Path).length == 0) {
        console.log('Nobody touch canvas.');
        touchId2Path = null;
        isTouching = false;
    }    
    var idx = ongoingTouchIndexById(evt.pointerId);
    ongoingTouches.splice(idx, 1);  // remove it; we're done
    statusMessage.content = `${ongoingTouches}`
} 

function ongoingTouchIndexById(idToFind) {
    for (var i = 0; i < ongoingTouches.length; i++) {
      var id = ongoingTouches[i].identifier;
      
      if (id == idToFind) {
        return i;
      }
    }
    return -1;    // not found
  } 