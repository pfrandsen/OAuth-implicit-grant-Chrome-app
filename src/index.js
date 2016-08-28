onload = function () {
  var logList = [];
  var server = {};
  var listenPort = 1337;
  var tcpServer = chrome.sockets.tcpServer;
  var tcpSocket = chrome.sockets.tcp;
  var serverSocketId = null;

  var response = [
    "<html>",
    "  <head>",
    "    <script src='https://code.getmdl.io/1.2.0/material.min.js'></script>",
    "    <link rel='stylesheet' href='https://code.getmdl.io/1.2.0/material.min.css'/>",
    "  </head>",
    "  <body>",
    "    <h4>OAuth2 Response - take 5</h4>",
    "    <table>",
    "      <tr>",
    "        <td><strong>access_token</strong></td><td>&nbsp;</td><td><input type= 'text' id= 'result-access_token' size= '50' /></td>",
    "      </tr>",
    "      <tr>",
    "        <td><strong>token_type</strong></td><td>&nbsp;</td><td><input type= 'text' id= 'result-token_type' size= '50' /></td>",
    "      </tr>",
    "      <tr>",
    "        <td><strong>expires_in</strong></td><td>&nbsp;</td><td><input type= 'text' id= 'result-expires_in' size= '50' /></td>",
    "      </tr>",
    "      <tr>",
    "        <td><strong>scope</strong></td><td>&nbsp;</td><td><input type= 'text' id= 'result-scope' size= '50' /></td>",
    "      </tr>",
    "      <tr>",
    "        <td><strong>state</strong></td><td>&nbsp;</td><td><input type= 'text' id= 'result-state' size= '50' /></td>",
    "      </tr>",
    "      <tr>",
    "        <td><strong>all</strong></td><td>&nbsp;</td><td><input type= 'text' id= 'result-all' size= '50' /></td>",
    "      </tr>",
    "    </table>",
    "    <script type='text/javascript'>",
    "      function setValue(value) {",
    "        var arr = value.split('=');",
    "        var key = arr[0];",
    "        var val = arr.length > 1 ? arr[1] : '';",
    "        var element = document.getElementById('result-' + key);",
    "        if (element)  {",
    "          element.value = val;",
    "        } else {",
    "          console.log('Unknown parameter: ' + key + ' = ' + val);",
    "        }",
    "      };",
    "      var response = window.location.hash.substring(1);",
    "      var keyVal = response.split('&');",
    "      ",
    "      document.getElementById('result-all').value = response;",
    "      keyVal.forEach(function(v) {",
    "        setValue(v);",
    "      });",
    "      document.getElementById('result-access_token').select();",
    "    </script>",
    "  </body>",
    "</html>"
  ].join("\n");

  function getRedirect() {
    return "http://localhost:" + listenPort + "callback.html";
  }

  function updateRedirect() {
    document.getElementById("redirect-uri").value = getRedirect();
  }

  function getLoginURI() {
    var uri;
    function getVal(key) {
      var e = document.getElementById(key);
      if (e) {
        return e.value.trim();
      }
      return "";
    }
    function addParam(key) {
      var val = getVal(key);
      if (val !== "") {
        uri += "&" + key + "=" + val;
      }
    }
    var clientId = getVal("client_id");
    var redirect = getVal("redirect-uri");
    var auth = getVal("auth-uri");
    if (clientId === "" || redirect === "" || auth === "") {
      return "";
    }
    uri = auth + "?response_type=token&client_id=" + clientId
      + "&redirect_uri=" + encodeURIComponent(redirect);
    addParam("auth_type");
    addParam("scope");
    addParam("state");
    return uri;
  }

  var port = document.getElementById("port");
  document.getElementById("login-button").onclick = function () {
    document.getElementById("message").innerHTML = "";
    console.log(document.getElementById("redirect-uri").value);
    var uri = getLoginURI();
    if (uri === "") {
      uri
      document.getElementById("message").innerHTML = "Redirect URI, client id, and authorization endpoint must be set";
    } else {
      console.log(uri);
      document.getElementById("the-view").src = uri;
    }
  }

  var initializeInspect = function () {
    console.log("set default");
    // set default values
    ['access_token', 'token_type', 'expires_in', 'scope', 'state', 'all'].forEach(function (key) {
      var element = document.getElementById('inspect-' + key);
      if (element) {
        element.value = "<undefined>";
      }
    });
    function setValue(value) {
      var arr = value.split('=');
      var key = arr[0];
      var val = arr.length > 1 ? arr[1] : '';
      var element = document.getElementById('inspect-' + key);
      if (element) {
        element.value = val;
      } else {
        console.log('Unknown parameter: ' + key + ' = ' + val);
      }
    };
    console.log("set values");
    // initialize values
    var arr = document.getElementById('the-view').src.split('#');
    if (arr.length > 1) {
      console.log(arr[1]);
      var keyVal = arr[1].split('&');
      document.getElementById('inspect-all').value = arr[1];
      keyVal.forEach(function (v) {
        setValue(v);
      });
      document.getElementById('result-access_token').select();
    } else {
      // log?
      console.log("no values")
    }
    console.log(document.getElementById('the-view').src);
  }

  // helper function for setting up event handlers for opening and closing pop-up dialogs
  var setupDialogHandler = function (key, init) {
    var initialize = init;
    var btn = document.getElementById(key);
    if (btn) {
      var dlg = document.getElementById(key + '-dialog');
      if (dlg) {
        var close = document.getElementById(key + '-dialog-close');
        btn.onclick = function () {
          if (initialize) {
            initialize();
          }
          dlg.showModal();
          if (close) {
            close.focus();
          }
        };
        if (close) {
          close.onclick = function () {
            dlg.close();
          };
        }
      }
    }
  };

  setupDialogHandler('info');
  setupDialogHandler('about');
  setupDialogHandler('help');
  setupDialogHandler('cca');
  setupDialogHandler('log');
  setupDialogHandler('inspect', initializeInspect);

  var stringToUint8Array = function (string) {
    var buffer = new ArrayBuffer(string.length);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < string.length; i++) {
      view[i] = string.charCodeAt(i);
    }
    return view;
  };

  var arrayBufferToString = function (buffer) {
    var str = '';
    var uArrayVal = new Uint8Array(buffer);
    for (var s = 0; s < uArrayVal.length; s++) {
      str += String.fromCharCode(uArrayVal[s]);
    }
    return str;
  };

  var logEntry = function (item) {
    logList.push([new Date(), item]);
    if (logList.length > 10) {
      logList.shift();
    }
  };

  var destroySocketById = function (socketId) {
    tcpSocket.disconnect(socketId, function () {
      tcpSocket.close(socketId);
    });
  };

  var closeServerSocket = function () {
    if (serverSocketId) {
      tcpServer.close(serverSocketId, function () {
        if (chrome.runtime.lastError) {
          console.warn("chrome.sockets.tcpServer.close:", chrome.runtime.lastError);
        }
      });
    }
    tcpServer.onAccept.removeListener(onAccept);
    tcpSocket.onReceive.removeListener(onReceive);
  };

  var sendReplyToSocket = function (socketId, buffer, keepAlive) {
    // verify that socket is still connected before trying to send data
    tcpSocket.getInfo(socketId, function (socketInfo) {
      if (!socketInfo.connected) {
        destroySocketById(socketId);
        return;
      }

      tcpSocket.setKeepAlive(socketId, keepAlive, 1, function () {
        if (!chrome.runtime.lastError) {
          tcpSocket.send(socketId, buffer, function (writeInfo) {
            console.log("WRITE", writeInfo);

            if (!keepAlive || chrome.runtime.lastError) {
              destroySocketById(socketId);
            }
          });
        }
        else {
          console.warn("chrome.sockets.tcp.setKeepAlive:", chrome.runtime.lastError);
          destroySocketById(socketId);
        }
      });
    });
  };

  var getResponseHeader = function (data) {
    return stringToUint8Array([
      "HTTP/1.0 200 OK",
      "Content-length: " + data.length,
      "Content-type:" + "text/html"
    ].join("\n") + "\n\n");
  };

  var writeResponse = function (socketId, header, body, keepAlive) {
    var outputBuffer = new ArrayBuffer(header.byteLength + body.byteLength);
    var view = new Uint8Array(outputBuffer);
    view.set(header, 0);
    view.set(body, header.byteLength);
    sendReplyToSocket(socketId, outputBuffer, keepAlive);
  };

  var onAccept = function (acceptInfo) {
    tcpSocket.setPaused(acceptInfo.clientSocketId, false);
    if (acceptInfo.socketId != serverSocketId)
      return;

    console.log("ACCEPT", acceptInfo);
  };

  var onReceive = function (receiveInfo) {
    console.log("READ", receiveInfo);
    var socketId = receiveInfo.socketId;

    var data = arrayBufferToString(receiveInfo.data);
    var uri = "<unknown>";
    var uriEnd = data.indexOf(" ", 4);
    if (uriEnd >= 0) {
      uri = data.substring(4, uriEnd);
    }

    var header = getResponseHeader(response);
    var body = stringToUint8Array(response);
    logEntry("Sending fixed response - request uri " + uri);
    writeResponse(socketId, header, body, false);

  };

  server.stop = function () {
    logEntry("Stopping server, port " + listenPort);
    closeServerSocket();
  };

  server.start = function () {
    logEntry("Starting server on port " + listenPort);
    tcpServer.create({}, function (socketInfo) {
      serverSocketId = socketInfo.socketId;

      //tcpServer.listen(serverSocketId, hosts.value, parseInt(port.value, 10), 50, function(result) {
      tcpServer.listen(serverSocketId, "127.0.0.1", listenPort, 50, function (result) {
        console.log("LISTENING:", result);

        tcpServer.onAccept.addListener(onAccept);
        tcpSocket.onReceive.addListener(onReceive);
      });
    });
  };

  updateRedirect();
  server.start();
};