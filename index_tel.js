import {
  textInput,
  button,
  dashboard,
  text,
  }from "https://unpkg.com/@marcellejs/core@0.6.4/dist/marcelle.bundle.esm.js";

  /*HomePage*/

  const welcome = text("Welcome to the mobile application, needed to confirm choices");
  welcome.title = "About";

  const label = textInput();
  label.title = 'Instance label';

  const capture = button('Capture');
  capture.$click.subscribe(() => {
    socket.send(label.$value.get());
  });

  const socket = new WebSocket('ws://localhost:3000');

  socket.onmessage = function(event) {
    
  };

  const app = dashboard({
    title: "EmoPlay",
    author: "IML Group C",
  });

  app.page('Answer').use(welcome, capture, label);
  app.show();