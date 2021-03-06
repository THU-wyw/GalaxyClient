var GameoverLayer = cc.Layer.extend({
    ctor: function() {
        this._super();
        var sprite = new cc.Sprite(res.Restart_png);
        this.winSize = cc.winSize;
        sprite.attr({
            x: this.winSize.width / 2,
            y: this.winSize.height * 0.35
        });
        this.addChild(sprite, 0);
        var hint = new cc.LabelTTF("Tap button below to restart ...", "Arial", 20);
        var menu = new cc.MenuItemLabel(hint, this.restartGame, this);
        menu.attr({
            x: this.winSize.width / 2,
            y: this.winSize.height * 0.6
        });
        this.addChild(menu, 0);
        this.addTouchListener();
    },

    addTouchListener: function () {
        var self = this;
        var touchListener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function(touch, event) {
                cc.log("restart");
                self.restartGame();
                return true;
            }
        });
        cc.eventManager.addListener(touchListener, self);
    },

    restartGame: function () {
        cc.director.replaceScene(new cc.TransitionSlideInR(1, new StartScene()));
//        cc.game.restart();
    }
});

var RestartScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GameoverLayer();
        this.addChild(layer);
    },
    onExit: function () {
        this._super();
    }
});

var StartLayer = cc.Layer.extend({
    gamePanel: null,
    playerId: 1,
    backgroundSparkles: [],
    walls: [],
    wallLocations: [],
    ovariumHaloTexture: null,
    peerTexture: null,
    windowSize: null,
    iScheduler: null,

    viewCenter: {
        x: 0,
        y: 0
    },

    ctor: function() {
        this._super();
        this.gamePanel = null;
        this.backgroundSparkles = [];
        this.walls = [];
        this.wallLocations = [];
        this.ovariumHaloTexture = null;
        this.peerTexture = null,
        this.init();
    },

    init: function() {
        this.initLayer();
        this.startGame();
    },

    initLayer: function() {
        this.setScale(0.75);
        this.windowSize = cc.winSize;
        this.cacheTextures();
        this.setupBackground();
        this.setupWalls();
        this.gamePanel = new gamePanel(this);
    },

    endGame: function() {
//        this.scheduler.
        this.cleanup();
        this.removeAllChildren(true);
        cc.director.replaceScene(new cc.TransitionSlideInL(1, new RestartScene()));
    },

    cacheTextures: function () {
        this.ovariumHaloTexture = cc.textureCache.addImage(res.OvariumHalo_png);
        this.peerTexture = cc.textureCache.addImage(res.PeerSmall_tga);
    },

    startGame: function() {
        this.gamePanel.start();
        this.addTouchListener();
    },

    convertToViewpointSpace: function (coor) {
//        cc.log(this.viewCenter);
        return {
            x: coor.x - this.viewCenter.x + this.windowSize.width / 2,
            y: coor.y - this.viewCenter.y + this.windowSize.height / 2
        }
    },

    generateRandomAnchorPointInWorldSpace: function () {
        return cc.p((1 - 2 * Math.random()) * globals.playground.width, (1 - 2 * Math.random()) * globals.playground.height);
    },

    generateRandomAnchorPointInViewSpace: function () {
        return this.convertToViewpointSpace(this.generateRandomAnchorPointInWorldSpace());
    },

    updateWalls: function () {
        if (this.walls == undefined) return;
        for (var i = 0; i < this.walls.length; i ++) {
            var wall = this.walls[i];
            var v_p = this.convertToViewpointSpace(this.wallLocations[i]);
            if (i == 0) {
//                cc.log(v_p);
            }
            wall.runAction(cc.place(v_p));
        }
    },

    setupWalls: function () {
        var wallTexture = cc.textureCache.addImage(res.WallPiece_tga);
        var wallPieceCorner = cc.textureCache.addImage(res.WallPieceCorner_tga);
        var scales = [
            // up, down, left, right
            globals.playground.width,
            globals.playground.width,
            globals.playground.height,
            globals.playground.height
        ]; // [x, y]
        var rotations = [90, 270, 0, 180, 90, 180, 270, 0];
        this.wallLocations = [
            // up, down, left, right
            {
                x: globals.playground.width / 2,
                y: globals.playground.height + globals.wallThickness / 2
        }, {
            x: globals.playground.width / 2,
                y: - globals.wallThickness / 2
        }, {
            x: - globals.wallThickness / 2,
                y: globals.playground.height / 2
        }, {
            x: globals.wallThickness / 2 + globals.playground.width,
                y: globals.playground.height / 2
        },
        // up-left, up-right, down-right, down-left
        {
            x: - globals.wallThickness / 2,
                y: globals.playground.height + globals.wallThickness / 2
        }, {
            x: globals.wallThickness / 2 + globals.playground.width,
                y: globals.playground.height + globals.wallThickness / 2
        }, {
            x: globals.wallThickness / 2 + globals.playground.width,
                y: - globals.wallThickness / 2
        }, {
            x: - globals.wallThickness / 2,
                y: - globals.wallThickness / 2
        }
        ];
//        console.log(locations);
        for (var i = 0; i < 8; i ++) {
            var wall = null;
            var s = globals.wallThickness / 128;

            if (i < 4) {
                wall = new cc.Sprite(wallTexture);
                wall.setScaleX(s);
                wall.setScaleY(scales[i] / 128);
            } else {
                wall = new cc.Sprite(wallPieceCorner);
                wall.setScale(s, s);
            }
            wall.setRotation(rotations[i]);
            wall.attr(this.wallLocations[i]);
            this.addChild(wall);
            this.walls.push(wall);
        }
    },

    updateBGSparkles: function () {
        var speed = this.velocity;
        for (var i = 0; i < this.backgroundSparkles.length; i ++) {
            var sparkle = this.backgroundSparkles[i];
            sparkle.runAction(cc.MoveBy(1 / globals.frameRate,
                - speed.x / 3,
                - speed.y / 3
            ));
        }
    },


    setupBackground: function () {
        var sparkleTexture = cc.textureCache.addImage(res.BlobSparkles_tga);
        this.backgroundSparkles = [];
        for (var i = 0; i < 100; i++) {
            var array = [];
            for (var j = 0; j < 5; j++) array.push(this.generateRandomAnchorPointInViewSpace());

            // shift action
            var action = cc.cardinalSplineBy(500, array, 0);
            var reverse = action.reverse();
            var sparkle = new cc.Sprite(sparkleTexture);
            var seq = cc.sequence(action, reverse);

            // scaling action
            var initScale = Math.max(Math.random() * 1.2, 0.5);
            sparkle.setScale(initScale);
            var scaleAction = cc.scaleBy(300, 0.9);
            var scaleBackAction = scaleAction.reverse();
            var seq1 = cc.sequence(scaleAction, scaleBackAction);

            // spin action
            var rotation = cc.rotateBy(100, 250 * (Math.random() + 0.1));
            if (Math.random() > 0.5) rotation = rotation.reverse();

            sparkle.runAction(cc.RepeatForever(rotation));
            sparkle.runAction(cc.RepeatForever(seq));
            sparkle.runAction(cc.RepeatForever(seq1));
            this.addChild(sparkle);
            this.backgroundSparkles.push(sparkle);
        }
    },

    addEjectionEffect: function (absortionPosition, angle) {
        var ejectionPSScale = 0.1;
        var ps = new cc.ParticleSystem(res.ParticleTexture_plist);
        ps.setScale(ejectionPSScale);
        var pos = this.convertToViewpointSpace(absortionPosition);
        ps.attr({
            sourcePos: cc.p(
                -440 + pos.x,
                420 + pos.y
            ),
            angle: (angle * 180) / Math.PI
        });
        ps.setPositionType(cc.ParticleSystem.TYPE_FREE);
        this.addChild(ps);
    },

    addAbsortionEffect: function (position, angle, scale) {
        var absortionHalo = new cc.Sprite(this.ovariumHaloTexture);
        angle = - angle * 180 / Math.PI + 90;

        absortionHalo.setRotation((angle + 360)% 180);
        absortionHalo.setScale(scale / 30);
        absortionHalo.attr(this.convertToViewpointSpace(position));
        absortionHalo.runAction(cc.fadeOut(0.1));
        this.addChild(absortionHalo, 2);
    },

    addTouchListener: function() {
        var self = this;
        var touchListener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function(touch, event) {
//                self.endGame();
//                return true;
                var pos = touch.getLocation();
                var angleVector = {
                    x: pos.x - self.windowSize.width / 2,
                    y: pos.y - self.windowSize.height / 2
                };
                var r = Math.sqrt(angleVector.x * angleVector.x + angleVector.y * angleVector.y);
                if (r == 0) r = 1;
                angleVector = {
                    x: angleVector.x / r,
                    y: angleVector.y / r
                };
//                console.log(angleVector);
                self.gamePanel.eject(angleVector);
                return true;
            }
        });
        cc.eventManager.addListener(touchListener, self);
    }
});

var StartScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
//        var startLayer = new StartLayer();
//        startLayer.init();
//        var layer = new cc.LayerMultiplex(startLayer, new GameoverLayer());
        var layer = new StartLayer();
        this.addChild(layer, 0);
//        director.runScene(this);
    },
    onExit: function () {
        this._super();
    }
});

