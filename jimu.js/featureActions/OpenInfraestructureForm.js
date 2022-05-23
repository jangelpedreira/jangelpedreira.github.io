///////////////////////////////////////////////////////////////////////////
// Copyright © TRAGSATEC.
//
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    // 'dojo/_base/array',
    '../BaseFeatureAction',
    'jimu/utils'
  ], function(declare, lang, BaseFeatureAction, utils) {
    return declare([BaseFeatureAction], {
      name: 'OpenInfraestructureForm',
      iconClass: 'icon-openInfraestructureForm',
  
      isFeatureSupported: function(featureSet, layer) {
		// Verificar si la entidad está soportada
        if (featureSet.features.length < 1 || !layer){
	 	   // Si el número de entidades es distinto de 1 o la capa está 
           // vacía devolver false para que no aparezca la feature action		   
           return false;
        }
        	      
        console.log("Layer name: " + layer.name);

        if (layer.name!='Poligonal' && layer.name!='Liñas') {
		   // Si el nombre de la entidad no es ni Poligonal ni Liñas
           // devolver false para que no aparezca la feature action
           return false;
        }
		else {
		   // Si el nombre de la entidad es Poligono o Liñas pero el 
           // id de la infraestructura está vacío, devolver false 
           // para que no aparezca la feature action 		   
		   feature = featureSet.features[0];
		   attributes = feature.attributes;
		   fieldName = "id_infraest";
		   idInfraestructura = attributes[fieldName];
		   
		   if (idInfraestructura==null)
			  return false;
		}

        return true;        
      },
  
      onExecute: function(featureSet, layer) {
        // Ejecución de la feature action
		feature = featureSet.features[0];
		attributes = feature.attributes;
		
		// Obtenener el id de la infraestructura para invocar a la aplicación de gestión		
		fieldName = "id_infraest";
		idInfraestructura = attributes[fieldName];
		console.log("Id. infraestructura: " + idInfraestructura.toString());
		
		// Obtener el tipo de infraestructura, utilizar en la URL
		if (layer.name=='Poligonal') 
			tipoInfraestructura = "/segamb/parques"
		else
			tipoInfraestructura = "/segamb/lineas"
		
        urlSEGAMB = "http://svjc-des-amtega.ttec.es" + tipoInfraestructura + "/" + idInfraestructura.toString() + "/titulares/consulta?_referer=" + tipoInfraestructura
        console.log("URL aplicación SEGAMB: " + urlSEGAMB);
     
		// Abrir laaplicación SEGAMB mostrando la infraestructura actual
        window.open(urlSEGAMB, "SEGAMB");
      }
    });
  });