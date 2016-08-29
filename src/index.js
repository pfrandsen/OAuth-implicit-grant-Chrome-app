onload = function () {
  var logList = [];
  var server = {};
  var listenPort = 1337;
  var tcpServer = chrome.sockets.tcpServer;
  var tcpSocket = chrome.sockets.tcp;
  var serverSocketId = null;
  var webview = document.getElementById("the-view");

  var response = [
    "<html>",
    "  <head>",
    "    <script src='https://code.getmdl.io/1.2.0/material.min.js'></script>",
    "    <link rel='stylesheet' href='https://code.getmdl.io/1.2.0/material.min.css'/>",
    "  </head>",
    "  <body>",
    "    <h4>OAuth2 Response</h4>",
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

  function updateRedirect() {
    //document.getElementById("redirect_uri").value = getRedirect();
    document.getElementById("listen_at").innerHTML = "http://localhost:" + listenPort + "/*";
  }

  // get value from text edit field
  function getTextValue(key) {
    var e = document.getElementById(key);
    if (e) {
      return e.value.trim();
    }
    return "";
  }

  function getLoginURI() {
    var uri;
    function addParam(key) {
      var val = getTextValue(key);
      if (val !== "") {
        uri += "&" + key + "=" + val;
      }
    }
    var clientId = getTextValue("client_id");
    var redirect = getTextValue("redirect_uri");
    var auth = getTextValue("auth_uri");
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

  document.getElementById("server_port").onclick = function () {
    var current = listenPort;
    var p = getPortValue(port.value);
    if (p != current) {
      server.stop();
      listenPort = p;
      updateRedirect();
      server.start();
    }

  }

  function getdProfileName(name) {
    return "oauth_ig_" + name;
  }

  function saveProfile(name) {
    var pName = getdProfileName(name);
    var prop = {};
    var store = {
      "port": getTextValue("port"),
      "client_id": getTextValue("client_id"),
      "redirect_uri": getTextValue("redirect_uri"),
      "auth_uri": getTextValue("auth_uri"),
      "auth_type": getTextValue("auth_type"),
      "scope": getTextValue("scope"),
      "state": getTextValue("state"),
      "profile_name": getTextValue("profile_name")
    };
    var jsonVal = JSON.stringify(store);
    prop[pName] = jsonVal;
    //      console.log(prop);
    //      console.log({ 'latest': jsonVal });
    chrome.storage.local.set(prop, function () {
      console.log('Settings saved - ' + name);
    });
  }

  function loadProfile(name) {
    var pName = getdProfileName(name);
    chrome.storage.local.get(pName, function (v) {
      function setVal(key, val) {
        if (val && val.length > 0) {
          var element = document.getElementById(key);
          if (element) {
            element.value = val;
          }
        }
      }
      console.log("reading stored profile '" + name + "'");
      if (v) {
        var values = JSON.parse(v[pName]);
        setVal("auth_type", values.auth_type);
        setVal("auth_uri", values.auth_uri);
        setVal("client_id", values.client_id);
        setVal("redirect_uri", values.redirect_uri);
        setVal("scope", values.scope);
        setVal("state", values.state);
        setVal("profile_name", values.profile_name);
        if (values.port) {
          var p = getPortValue(values.port);
          if (p != listenPort) {
            server.stop();
            listenPort = p;
            setVal("port", "" + listenPort);
            updateRedirect();
            server.start();
          }
        }
      }
    });

  }

  function getPortValue(str) {
    try {
      var p = parseInt(str, 10);
      if (p >= 1024 && p < 65536) {
        return p;
      }
    } catch (error) {
      console.log(error);
    }
    return 1337;
  }

  document.getElementById("profile-save-button").onclick = function () {
    var name = getTextValue("profile_name").trim();
    if (name.length > 0) {
      saveProfile(name);
    }
  }

  document.getElementById("profile-load-button").onclick = function () {
    var name = getTextValue("profile_name").trim();
    if (name.length > 0) {
      loadProfile(name);
    }
  }

  document.getElementById("login-button").onclick = function () {
    document.getElementById("message").innerHTML = "";
    console.log(document.getElementById("redirect_uri").value);
    var uri = getLoginURI();
    if (uri === "") {
      document.getElementById("message").innerHTML = "Redirect URI, client id, and authorization endpoint must be set";
    } else {
      saveProfile('latest');
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
      document.getElementById('inspect-access_token').select();
    } else {
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

  // show oauth attributes when webview loads uri with access_token value in fragment
  webview.addEventListener("contentload", function () {
    try {
      var arr = webview.src.split('#');
      if (arr.length > 1) {
        if (arr[1].includes("access_token")) {
          document.getElementById('inspect').click();
        }
      }
    } catch (e) { }
  });

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

        //destroySocketById(serverSocketId);
        //serverSocketId = null;
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
    writeResponse(socketId, header, body, true);

  };

  server.stop = function () {
    logEntry("Stopping server, port " + listenPort);
    closeServerSocket();
    //destroySocketById(serverSocketId);
    //serverSocketId = null;
  };

  server.start = function () {
    logEntry("Starting server on port " + listenPort);
    tcpServer.create({}, function (socketInfo) {
      serverSocketId = socketInfo.socketId;

      tcpServer.listen(serverSocketId, "127.0.0.1", listenPort, 50, function (result) {
        console.log("LISTENING (" + listenPort + ")", result);

        tcpServer.onAccept.addListener(onAccept);
        tcpSocket.onReceive.addListener(onReceive);
      });
    });
  };

  updateRedirect();
  // set default value
  port.value = listenPort;
  server.start();
  // load parameters if set previously
  loadProfile('latest');

  chrome.app.window.onClosed.addListener(function () {
    server.stop();
  });
};
