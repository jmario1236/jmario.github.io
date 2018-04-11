var nuevos_marcadores = [];
var marcadores_bd = [];
var mapa = null;
var formulario;

function buscarMarcador(id) {
    for (i in marcadores_bd) {
        //console.log(marcadores_bd[i].id);
        if (marcadores_bd[i].idMarcador === id)
            return marcadores_bd[i];
    }
    return false;
}

function eliminarMarcador(marcador) {
    marcador.setMap(null);
}

function limpiar_marcadores(lista) {
    for (i in lista) {
        lista[i].setMap(null);
    }
}
function initMap() {
    mapa = new google.maps.Map(document.getElementById('mapa'), {
        center: { lat: 10.3888429, lng: -75.5154813 },
        zoom: 8
    });

    var config = {
        apiKey: "AIzaSyBrUrXD2OuDu4XtADNZYwsnwjTJf4faU6s",
        authDomain: "taller1-7e7e0.firebaseapp.com",
        databaseURL: "https://taller1-7e7e0.firebaseio.com",
        projectId: "taller1-7e7e0",
        storageBucket: "taller1-7e7e0.appspot.com",
        messagingSenderId: "873631209942"
    };
    firebase.initializeApp(config);

    // Initialize Cloud Firestore through Firebase
    var db = firebase.firestore();

    formulario = $("#formulario");
    google.maps.event.addListener(mapa, "click", function (event) {
        var coordenadas = event.latLng.toString();

        coordenadas = coordenadas.replace("(", "");
        coordenadas = coordenadas.replace(")", "");

        var lista = coordenadas.split(",");

        var direccion = new google.maps.LatLng(lista[0], lista[1]);
        formulario.find("input[name='titulo']").focus();
        formulario.find("input[name='cx']").val(lista[0]);
        formulario.find("input[name='cy']").val(lista[1]);


        var marcador = new google.maps.Marker({

            position: direccion,
            map: mapa,
            animation: google.maps.Animation.DROP,
            draggable: false
        });

        nuevos_marcadores.push(marcador);
        limpiar_marcadores(nuevos_marcadores);

        marcador.setMap(mapa);
    });

    function listar() {
        limpiar_marcadores(marcadores_bd);
        marcadores_bd = [];
        var f_eliminar = $("#formulario_eliminar");

        db.collection("mapa").get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                puntos = doc.data();
                var posi = new google.maps.LatLng(puntos.cx, puntos.cy);//bien

                var marca = new google.maps.Marker({
                    idMarcador: doc.id,
                    position: posi,
                    titulo: puntos.titulo,
                    cx: puntos.cx,
                    cy: puntos.cy
                });
                google.maps.event.addListener(marca, "click", function () {
                    if ($("#opc_edicion").prop("checked")) {

                        marca.setOptions({ draggable: true });

                        google.maps.event.addListener(marca, 'dragend', function (event) {

                            var coordenadas = event.latLng.toString();
                            coordenadas = coordenadas.replace("(", "");
                            coordenadas = coordenadas.replace(")", "");
                            var lista = coordenadas.split(",");
                            f_eliminar.find("input[name='cx']").val(lista[0]);
                            f_eliminar.find("input[name='cy']").val(lista[1]);
                        });
                    }
                    else {
                        console.log(marca.idMarcador);
                        f_eliminar.find("input[name='titulo']").val(marca.titulo);
                        f_eliminar.find("input[name='cx']").val(marca.cx);
                        f_eliminar.find("input[name='cy']").val(marca.cy);
                        f_eliminar.find("input[name='id']").val(marca.idMarcador);
                    }
                    limpiar_marcadores(nuevos_marcadores);
                });

                marca.setMap(mapa);
                marcadores_bd.push(marca);
            });
        });

    }

    $("#btn_grabar").on("click", function () {

        var f = $("#formulario");


        if (f.find("input[name='titulo']").val().trim() == "") {
            alert("Falta título");
            return false;
        }

        if (f.find("input[name='cx']").val().trim() == "") {
            alert("Falta Coordenada X");
            return false;
        }

        if (f.find("input[name='cy']").val().trim() == "") {
            alert("Falta Coordenada Y");
            return false;
        }


        if (f.hasClass("busy")) {

            return false;
        }

        f.addClass("busy");


        var loader_grabar = $("#loader_grabar");
        loader_grabar.removeClass("label-success").addClass("label label-warning")
            .text("Procesando...").slideDown();
        db.collection("mapa").add({
            cx: $("#cx").val(),
            cy: $("#cy").val(),
            titulo: $("#titulo").val()
        })
            .then(function (docRef) {
                //console.log("Document written with ID: ", docRef.id);
                loader_grabar.removeClass("label-warning").addClass("label-success")
                    .text("Grabado OK").delay(4000).slideUp();
                listar();
                f.removeClass("busy");
                f[0].reset();
            })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            });

        return false;
    });

    $("#btn_borrar").on("click", function () {
        var f_eliminar = $("#formulario_eliminar");
        let id = f_eliminar.find("input[name='id']").val();
        db.collection("mapa").doc(id).delete().then(function () {
            console.log("Document successfully deleted!");
            f_eliminar[0].reset();
            eliminarMarcador(buscarMarcador(id));
        }).catch(function (error) {
            console.error("Error removing document: ", error);
        });
    });

    //ACTUALIZAR
    $("#btn_actualizar").on("click", function () {
        var f_eliminar = $("#formulario_eliminar");
        let id = f_eliminar.find("input[name='id']").val();
        db.collection('mapa').doc(id).set({
            cx: f_eliminar.find("input[name='cx']").val(),
            cy: f_eliminar.find("input[name='cy']").val(),
            titulo: f_eliminar.find("input[name='titulo']").val()
        })
            .then(function () {
                console.log("Document successfully written!");
                f_eliminar[0].reset();
                listar();
            })
            .catch(function (error) {
                console.error("Error writing document: ", error);
            });
    });


    $("#btn_buscar").on("click", function () {
        var palabra_buscar = $("#palabra_buscar").val();
        var select_resultados = $("#select_resultados");
        select_resultados.empty();
        db.collection("mapa").where("titulo", "==", palabra_buscar)
        .get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                let item = doc.data();  
                $("<option data-cx='" + item.cx + "' data-cy='" + item.cy + "' value='" + doc.id + "'>" + item.titulo + "</option>")
                            .appendTo(select_resultados);              
                //console.log(doc.id, " => ", doc.data());
            });
        })
        .catch(function(error) {
            console.log("Error getting documents: ", error);
        });
        

       return false;
    });


    $("#select_resultados").on("click, change", function () {

        if ($(this).children().length < 1) {
            return false;
        }
        var cx = $("#select_resultados option:selected").data("cx");
        var cy = $("#select_resultados option:selected").data("cy");

        var myLatLng = new google.maps.LatLng(cx, cy);

        mapa.setCenter(myLatLng);
    });



    listar();
}

