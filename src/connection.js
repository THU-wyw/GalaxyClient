var Connection = Connection || {};

Connection = function (gamePanel, host, port) {
    var self = this;
    this.host = host;
    this.port = port;
    this.gamePanel = gamePanel;
    this.pomelo = window.pomelo;

};

Connection.prototype.connect = function(next) {
    var self = this;
    var route = 'gate.gateHandler.queryEntry';
    self.pomelo.init({
        host: self.host,
        port: self.port,
        log: true
    }, function() {
        self.pomelo.request(route, { }, function(data) {
            self.startConnectorSession(data.host, data.port, next);
        })
    })
};

Connection.prototype.startConnectorSession = function(host, port, next) {
    var self = this;
    var route = 'connector.entryHandler.entry';
    self.pomelo.init({
        host: host,
        port: port,
        log: true
    }, function() {
        pomelo.request(route, {
        }, function(data) {
            console.log(data);
            self.gamePanel.layer.playerId = data.playerId;
            next();
        });
    });
};

Connection.prototype.startGame = function(next) {
    var self = this;
    this.pomelo.on('onNewPlayer', function(data) {
        console.log('new player!');
        console.log(data);
        self.gamePanel.playerList[data.playerId] = data.aster.asterId;
        self.gamePanel.asterList[data.aster.asterId] = new Aster(data.aster);
        self.gamePanel.asterList[data.aster.asterId].createSprites(self.gamePanel.layer);
    });
    this.pomelo.on('onPlayerEject', function(data) {
        console.log('new player!');
        console.log(data);
        self.gamePanel.playerEject(data.playerId, data.angleVector, data.asterId);
    });
    this.pomelo.request('gameHall.playerHandler.addToGame', { }, function(data) {
        console.log(data);
        self.gamePanel.playerList = data.playerList;
        for (var i in data.asterList) {
            self.gamePanel.asterList[i] = new Aster(data.asterList[i]);
        }
        setInterval(function() {self.updateData();}, 5000);
        next();
    });
};


// TODO for THU-wyw
// Called when local ejection event is evoked
// Maybe the whole list of peer should be updated
Connection.prototype.eject = function (angleVector, next) {
    var self = this;
    var route = 'gameHall.playerHandler.eject';
    this.pomelo.request(route, {
        angleVector: angleVector
    }, function(asterId) {
        next(asterId);
    });
};

Connection.prototype.updateData = function() {
    var self = this;
    var route = 'gameHall.playerHandler.updateData';
    console.log(self);
    self.pomelo.request(route, {}, function(data) {
        self.gamePanel.playerList = data.playerList;
        var asterList = self.gamePanel.asterList;
        console.log(self.gamePanel.layer.playerId);
        console.log(data);
        for (var asterId in asterList) {
            if (data.asterList[asterId] == undefined) {
                asterList[asterId].deleteAster();
                delete asterList[asterId];
            }
        }
        for (var asterId in data.asterList) {
            if (asterList[asterId] == undefined) {
                asterList[asterId] = new Aster(data.asterList[asterId]);
                asterList[asterId].createSprites(self.gamePanel.layer);
            } else {
                var aster = new Aster(data.asterList[asterId]);
                aster.asterSprite = asterList[asterId].asterSprite;
                asterList[asterId] = aster;
                asterList[asterId].asterSprite.aster = aster;
            }
        }
    });
};
