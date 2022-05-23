///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare', 'jimu/BaseWidget',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/graphicsUtils',
  'esri/layers/FeatureLayer',
  'esri/renderers/SimpleRenderer',
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  'esri/tasks/GeometryService',
  'esri/tasks/BufferParameters',
  'esri/config',
  'dojo/_base/lang',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/_base/array',
  'esri/Color'], 
  function(declare, BaseWidget, SimpleMarkerSymbol, SimpleLineSymbol, 
           SimpleFillSymbol, graphicsUtils, FeatureLayer, SimpleRenderer,
           Query, QueryTask, GeometryService, BufferParameters, esriConfig, 
           lang, dom, domConstruct, array, Color) {
    
    var featureLayerAnterior = null;
    var numInfraestructurasPrevias = 0;


    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-showNaturalAffections',

      //this property is set by the framework when widget is loaded.
      name: 'showNaturalAffections',
      symbol: null,

      
      //methods to communication with app container:

      postCreate: function() {
      //   this.inherited(arguments);
      //   console.log('postCreate');  
      },

      /*startup: function() {
        this.inherited(arguments);
        this.mapIdNode.innerHTML = 'map id:' + this.map.id;
        console.log('startup');
      },*/

      onOpen: function(){
        //console.log('onOpen');
        this.inherited(arguments);
        var that = this;

        if (featureLayerAnterior!=null)  {
          this.map.removeLayer(featureLayerAnterior);
        }

        console.log("ShowNaturalAffections - onOpen");
        funciOnClick = funciOnClick2;
        funcionQuery = funcionQuery2;

        this.map.setInfoWindowOnClick(false);
        // Capturar el envento click del mapa
        // Con lang.hitch utilizaremos "this" en el ámbito de la función asociada al evento
        this.map.on("click", lang.hitch(this, function(evt) {          

          console.log("Entra en el evento click sobre el mapa");

          numInfraestructurasPrevias = 0;

          this.map.graphics.clear();

          // Borrar la lista de infraestructuras del dropdown button
          var node = dom.byId('dropdownBtnList');
          while (node.hasChildNodes()) {
            node.removeChild(node.firstChild);
          }
          
          // El evento del mapa contiene exactamente donde ha hecho click el usuario sobre el mapa
          var point = evt.mapPoint;

          // Obtener una geometría de buffer alrededor del punto donde ha hecho click el usuario
          var params = new BufferParameters();
          esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer");
          params.distances = [100];
          params.outSpatialReference = that.map.spatialReference;
          params.unit = GeometryService.UNIT_METER;
          params.geometries = [point];
          esriConfig.defaults.geometryService.buffer(params, showBuffer);  
        }));


        function showBuffer(bufferedGeometries) {
          
          console.log("ShowBuffer");

          var geometryBuffer = bufferedGeometries[0];

          console.log("GeometryBuffer" + geometryBuffer);  

          var outFields = new Array("id_infraest", "num_exped", "nome", "nome_abrev");
        
          // Obtener las poligonales de los parques que intersecatan con el punto 
          var queryTaskPoligonales = new QueryTask("https://svjc-pro-agport.tragsatec.es/server/rest/services/Parques_Eolicos_Galicia/SEGAMB/MapServer/19");
          var queryPoligonales = new Query();
          queryPoligonales.returnGeometry = true;
          queryPoligonales.outFields = outFields;
          queryPoligonales.geometry = geometryBuffer;
          queryPoligonales.spatialRelationship = Query.SPATIAL_REL_INTERSECTS; 

          console.log("Ejecutar query sobre la layer Poligonales");
          queryTaskPoligonales.execute(queryPoligonales, showResults);
  
          // Obtener las linas eléctricas que intersecatan con el punto 
          var queryTaskLinas = new QueryTask("https://svjc-pro-agport.tragsatec.es/server/rest/services/Parques_Eolicos_Galicia/SEGAMB/MapServer/4");
          var queryLinas = new Query();
          queryLinas.returnGeometry = true;
          queryLinas.outFields = outFields;
          queryLinas.geometry = geometryBuffer;
          queryLinas.spatialRelationship = Query.SPATIAL_REL_INTERSECTS; 

          console.log("Ejecutar query sobre la layer Linas");
          queryTaskLinas.execute(queryLinas, showResults);
        
        }

        function showResults(response) {
          var feature;
          var features = response.features;
  
          console.log("ShowNaturalAffections - showResults");
          numInfraestructuras = features.length;
          console.log("Nº infraestructuras: " + numInfraestructuras.toString());
          for (var i = 0; i < features.length; i++) {
            feature = features[i];

            idInfraest = feature.attributes["id_infraest"];
            numExpediente = feature.attributes["num_exped"];
            nome = feature.attributes["nome"];
            nomeAbreviado = feature.attributes["nome_abrev"];

            var ulBtn = dom.byId("dropdownBtnList");
            var liName =  numExpediente + " - " + nomeAbreviado;
            var liQuery = numExpediente;
            var liBtn = domConstruct.create("li", {}, ulBtn);
            var aLiBtn = domConstruct.create("a", {
                'innerHTML':liName,
                'onClick' : "funcionQuery('" + liQuery + "');"
                }, liBtn);
            
            console.log("Infraestructura ID: " + idInfraest + " - Nº expediente: " + numExpediente + " - Nome: " + nome + " - Nome abreviado: " + nomeAbreviado);
            
            console.log("numInfraestructuras PREVIOUS: " + numInfraestructurasPrevias.toString());
            if (numInfraestructurasPrevias == 0) {
              numInfraestructurasPrevias++;
              console.log("numInfraestructuras POST:" + numInfraestructurasPrevias.toString());
              
              console.log("Tipo de geometría a añadir al mapa: " + response.geometryType);
              if (response.geometryType=="esriGeometryPolygon") {
                var symbol = new SimpleFillSymbol(
                  SimpleFillSymbol.STYLE_SOLID,
                  new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([255, 0, 0, 0.9]), 3),
                  new Color([255, 0, 0, 0]));  
    
              }
              else {
                var symbol = new SimpleLineSymbol(
                  SimpleLineSymbol.STYLE_SOLID,
                  new Color([255, 0, 0, 0.9]),3);
    
              }
              var graphic = features[0];
              graphic.setSymbol(symbol);
              that.map.graphics.add(graphic);
              
              // Calcular la extensión de la capa a añadir al mapa
              var featureExtent = graphicsUtils.graphicsExtent(graphic);
              
              // Centrar el mapa enla capa              
              that.map.setExtent(featureExtent, true);
              console.log("Geometría añadida al mapa");
              funcionQuery2(liQuery);
            }
            else 
              numInfraestructurasPrevias++;
            
          }
        }

        function funcionQuery2(expresion) {

          console.log("Entra en funcionQuery2")

          // Borrar las filas existentes en la tabla de afecciones 
          var node = document.getElementById('tableContentPatNatural');
          while (node.hasChildNodes()) {
            node.removeChild(node.firstChild);
          }
          var node = document.getElementById('tableContentPatCultural');
          while (node.hasChildNodes()) {
            node.removeChild(node.firstChild);
          }
          
          
          // Obtener las afecciones de del primer expediente de infraestructura encontrado
          // Obtener las poligonales de los parques que intersecatan con el punto 
          outFields = ["id_infraest", "num_exped", "categoria", "tipo", "nome", "capa", "campo_id", "valor_id", "capa_id"];
          
          var _showAfecciones = function(tipoAfeccion) {
            return function(response) {
              var feature;
          
              console.log("ShowAfecciones del tipo: " + tipoAfeccion);          
              var features = response.features;
          
              numAfecciones = features.length;
              console.log("Entra en showAfecciones - Nº afecciones: " + numAfecciones.toString());
              for (var i = 0; i < features.length; i++) {
                feature = features[i];
                categoria = feature.attributes["categoria"];
                tipo = feature.attributes["tipo"];
                nome = feature.attributes["nome"];
                capa = feature.attributes["capa"];
                capaId = feature.attributes["capa_id"];
                campoId =  feature.attributes["campo_id"];
                valorId =  feature.attributes["valor_id"];
                
                if (tipoAfeccion=="NATURAL") 
                  var featureRow = domConstruct.create("tr", {'onClick' : "funciOnClick('" + capa + "'," +  capaId.toString() + ", '" + campoId + "', " + valorId +");"}, "tableContentPatNatural");
                else  
                  var featureRow = domConstruct.create("tr", {'onClick' : "funciOnClick('" + capa + "'," +  capaId.toString() + ", '" + campoId + "', " + valorId +");"}, "tableContentPatCultural");

                var newCell0 = featureRow.insertCell(0);
                newCell0.innerHTML = categoria;
                var newCell1 = featureRow.insertCell(1);
                newCell1.innerHTML = tipo;
                var newCell1 = featureRow.insertCell(2);
                newCell1.innerHTML = nome;
            
                console.log("Afeccion -> Categoria: " + categoria + " - Tipo:" + tipo + " - Nome: " + nome + " - Capa: " + capa + " - Capa ID: " + capaId);
              }
            }
          }

          var tiposAfecciones = ["NATURAL", "CULTURAL"];
          var tipoAfeccion = "";
          for (i=0;i<tiposAfecciones.length;i++) {
            tipoAfeccion = tiposAfecciones[i];
            console.log("Tipo de afeccion: " + tipoAfeccion )
            if (tipoAfeccion=='NATURAL')
              urlAfeccion = "https://svjc-pro-agport.tragsatec.es/server/rest/services/Parques_Eolicos_Galicia/Edicion_SEGAMB/MapServer/12";
            else 
              urlAfeccion = "https://svjc-pro-agport.tragsatec.es/server/rest/services/Parques_Eolicos_Galicia/Edicion_SEGAMB/MapServer/11";

            console.log("URL Afeccion: " + urlAfeccion)

            var queryTaskAfecciones = new QueryTask(urlAfeccion);
            var queryAfecciones = new Query();
            queryAfecciones.returnGeometry = false;
            queryAfecciones.outFields = outFields;
            //queryAfeccionesNatural.orderByFields = ["cateogoria tipo DESC"];
        
            var clausulaWhere = "num_exped = '" + expresion + "'";
            queryAfecciones.where = clausulaWhere;
            console.log("clausulaWhere: " + clausulaWhere);

            console.log("Ejecutar query sobre tipo de afección " + tipoAfeccion);
            queryTaskAfecciones.execute(queryAfecciones, _showAfecciones(tipoAfeccion));
            console.log("Ejecutada query");
          }
        }

        function funciOnClick2(capa, capaId, campoId, valorId) {
            console.log("ShowNaturalAffections - funciOnClick");

            console.log("Capa: " + capa + " - capaId: " + capaId.toString() + " - campoId: " + campoId + "- valorId: " +  valorId);
            
            if (featureLayerAnterior!=null) {
              console.log("Borrar la Feature Layer anterior: " + featureLayerAnterior.name + " - tipo geometría: " + featureLayerAnterior.geometryType);              
              that.map.removeLayer(featureLayerAnterior);
            }

            // Seleccionar el elemento de la capa de patrimonio natural que representa la afección
            
            // Componer la url de la capa concatenando a la URL del servicio el id de la capa
            urlFeatureLayer = "https://svjc-pro-agport.tragsatec.es/server/rest/services/Parques_Eolicos_Galicia/SEGAMB/MapServer/" + capaId.toString();
            console.log("URL Feature layer: " + urlFeatureLayer);
            
            // Add the census block points in on demand mode. An outfield is specified since it is used when calculating   the total population falling within the one mile radius.
            var featureLayer = new FeatureLayer(urlFeatureLayer,{
              outFields: ["*"]
            });
                      
            var query = new Query();
            var clausulaWhere = campoId + " = " + valorId.toString();
            query.where = clausulaWhere;
            query.outFields = ["*"];
            console.log("Cláusula where: " + clausulaWhere);  

            var deferred = featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(featuresSelected) {
              console.log("Seleccionar entidades que cumplen la cláusual where");
              
              console.log("Número de Features tras query: " + featureLayer.graphics.length);
              console.log("Feature layer: " + featureLayer.name);
              console.log("Establecer simbología para la geometría de tipo: " + featureLayer.geometryType);

              // Make unselected features invisible
              var nullSymbol = new SimpleMarkerSymbol().setSize(0);
              featureLayer.setRenderer(new SimpleRenderer(nullSymbol));

              // Establecer la simbología en función de la geometría de la entidad de patrimonio afectada
              switch (featureLayer.geometryType) {
                case "esriGeometryPoint":
                  console.log("Simbología de tipo punto para la Feature layer: " + featureLayer.name);
                  // Simbología a aplicar al elemento de patrimonio natural de tipo punto afectado
                  var symbol = new SimpleMarkerSymbol(
                                    SimpleMarkerSymbol.STYLE_CIRCLE,
                                    12,
                                    new SimpleLineSymbol(
                                      SimpleLineSymbol.STYLE_NULL,
                                      new Color([247, 34, 101, 0.9]),1),
                                    new Color([207, 34, 171, 0.5]));
                  break;
                case "esriGeometryPolyline":
                  // Simbología a aplicar al elemento de patrimonio natural de tipo línea afectado
                  console.log("Simbología de tipo línea para la Feature layer: " + featureLayer.name);
                  var symbol = new SimpleLineSymbol(
                                    SimpleLineSymbol.STYLE_SOLID,
                                    new Color([247, 34, 101, 0.9]),2);
                  break;
                case "esriGeometryPolygon":
                  // Simbología a aplicar al elemento de patrimonio natural de tipo línea afectado
                  console.log("Simbología de tipo polígono para la Feature layer: " + featureLayer.name);
                  var symbol = new SimpleFillSymbol(
                                  SimpleFillSymbol.STYLE_SOLID,
                                  new SimpleLineSymbol(
                                    SimpleLineSymbol.STYLE_DASHDOT,
                                    new Color([247, 34, 101, 0.9]), 1),
                                  new Color([207, 34, 171, 0.5]));  
                  break;
              }              
             
              featureLayer.setSelectionSymbol(symbol);

              // Calcular la extensión de la capa a añadir al mapa
              var featureLayerExtent = graphicsUtils.graphicsExtent(featuresSelected);
              
              // Centrar el mapa enla capa              
              that.map.setExtent(featureLayerExtent, true);
              //that.map.infoWindow.setFeatures([deferred]);
              that.map.infoWindow.setFeatures(featureLayer.graphics[0]);

              console.log("Número de Features tras query: " + featureLayer.graphics.length);
              
              var attribute;
              for (attribute in featureLayer.graphics[0].attributes)
                console.log("Atributo: " + attribute);
              
              //that.map.infoWindow.setContent(featureLayer.graphics[0].getContent())
              //that.map.infoWindow.show(featureLayerExtent.getCenter());                      
              
            });  
            // Añadir la capa al mapa
            that.map.addLayer(featureLayer);          
            
            featureLayerAnterior = featureLayer; 
        }
      },

      onClose: function(){
        console.log('ShowNaturalAffections - onClose');
        this.map.setInfoWindowOnClick(true);

        if (featureLayerAnterior!=null)  {
          this.map.removeLayer(featureLayerAnterior);
        }

        this.map.graphics.hide();
      },

      onMinimize: function(){
         console.log('ShowNaturalAffections - onMinimize');
         this.map.setInfoWindowOnClick(true);

         if (featureLayerAnterior!=null)  {
          this.map.removeLayer(featureLayerAnterior);
        }
      },

      onMaximize: function(){
         console.log('ShowNaturalAffections - onMaximize');
         this.map.setInfoWindowOnClick(false);
      },

      // onSignIn: function(credential){
      //   /* jshint unused:false*/
      //   console.log('onSignIn');
      // },

      // onSignOut: function(){
      //   console.log('onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('onPositionChange');
      // },

      // resize: function(){
      //   console.log('resize');
      // }

      //methods to communication between widgets:

    });
  });