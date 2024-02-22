import {
    datasetBrowser,
    button,
    dashboard,
    dataset,
    dataStore,
    mlpClassifier,
    mobileNet,
    modelParameters,
    confidencePlot,
    trainingProgress,
    textInput,
    toggle,
    trainingPlot,
    webcam,
    throwError,
    text,
    batchPrediction,
    imageUpload,
  } from "https://unpkg.com/@marcellejs/core@0.6.4/dist/marcelle.bundle.esm.js";
  
  /*HOMEPAGE*/

  const welcome = text("Hello, welcome to emoapp, an application designed to train emotion recognition. Children with severe autism can have difficulty recognising the emotions a person is transmitting. This site aims to improve the perception of facial signs of emotion through training. The best thing about this site is that you get live feedback from the ia, which helps you to understand where you need to improve, etc.");
  welcome.title = "About"
  
  const game = button('Start a training');

  /*CREATE MODEL AND PREDICT*/

  const input = webcam();
  const featureExtractor = mobileNet();

  const label = textInput();
  label.title = 'Instance label';
  const capture = button('Hold to record instances');
  capture.title = 'Capture instances to the training set';

  const store = dataStore('localStorage');
  const trainingSet = dataset('training-set-dashboard', store);
  const trainingSetBrowser = datasetBrowser(trainingSet);

  input.$images
    .filter(() => capture.$pressed.get())
    .map(async (img) => ({
      x: await featureExtractor.process(img),
      thumbnail: input.$thumbnails.get(),
      y: label.$value.get(),
    }))
    .awaitPromises()
    .subscribe(trainingSet.create);

  const myImageUpload = imageUpload({ width: 32, height: 32});
  myImageUpload.$images
    .map(async (x2) => ({
      x: await featureExtractor.process(x2),
      thumbnail: myImageUpload.$thumbnails.get(),
      y: label.$value.get(),
    }))
    .awaitPromises()
    .subscribe(trainingSet.create);  

  const b = button('Train');
  b.title = 'Training Launcher';
  const classifier = mlpClassifier({ layers: [64, 32], epochs: 20 }).sync(store, 'mlp-dashboard');
    
  b.$click.subscribe(() => classifier.train(trainingSet));
    
  const params = modelParameters(classifier);
  const prog = trainingProgress(classifier);
  const plotTraining = trainingPlot(classifier);

  /*TRAINING EN DIRECT*/
  const tog = toggle('toggle prediction');
  tog.$checked.subscribe((checked) => {
    if (checked && !classifier.ready) {
      throwError(new Error('No classifier has been trained'));
      setTimeout(() => {
        tog.$checked.set(false);
      }, 500);
    }
  });

  const predictionStream = input.$images
    .filter(() => tog.$checked.get() && classifier.ready)
    .map(async (img) => classifier.predict(await featureExtractor.process(img)))
    .awaitPromises();

  const plotResults = confidencePlot(predictionStream);

  /*PRÉDICTION BATCH*/

  const batchMLP = batchPrediction('mlp', store);
  
  const predictButton = button('Update predictions');
  predictButton.$click.subscribe(async () => {
    if (!classifier.ready) {
      throwError(new Error('No classifier has been trained'));
    }
    await batchMLP.clear();
    await batchMLP.predict(classifier, trainingSet);
  });

  /*COMMUNICATION AVEC LE TELEPHONE*/
  const socket = new WebSocket('ws://localhost:3000');

  game.$click.subscribe(() => {
    socket.send('NextButtonClicked');
    window.location.href = "#training";
  });

  socket.onmessage = function(event) {
    var reader = new FileReader();
    reader.onload = function() {
        var dataAsString = reader.result;
        const v = text(dataAsString);
        label.$value.set(v.$value.get());
        capture.$pressed.set(true);
        setTimeout(() => {
          capture.$pressed.set(false);
        }, 200);
      }
    reader.readAsText(event.data);
  };

  /*DISPLAY ALL*/
  const app = dashboard({
    title: "EmoPlay",
    author: "IML Group C",
  });
  
  app.page("Home").use(welcome, game).sidebar();
  app.page("Configure Model")
    .sidebar(input, featureExtractor, myImageUpload)
    .use([label,capture], trainingSetBrowser, params, b, prog, plotTraining);

  app.page("Game").use(tog, plotResults).sidebar(input);
  app.settings.dataStores(store).datasets(trainingSet).models(classifier).predictions(batchMLP);
  app.show();




  