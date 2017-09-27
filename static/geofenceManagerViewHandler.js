RED.nodes.registerType('geofence-manager', {
    category: 'config',
    label: function () {
        return "geofence manager";
    },
    defaults: {
        geofenceMap: { value: [] }
    },
    oneditprepare: function () {
        console.log("in edit prepare of geofenceManager");

        function setupMap(node) {


            var map = L.map('node-geofence-map').setView([57.696, 11.9788], 9);

            window.node_geofence_map = map;
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 20,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            }).addTo(map);

            var drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);

            var mapElement = document.getElementById("node-geofence-map");

            console.log("geofenceMap in manager html: ");
            console.log(node.geofenceMap);

            var shapeList = [];

            for (let i = 0; i < node.geofenceMap.length; i++) {
                var key = node.geofenceMap[i];
                var fence = key[1];

                if (fence == null) continue;

                var deleteButton = document.createElement('button');
                var deleteID = "delete" + i;
                deleteButton.id = deleteID;
                deleteButton.innerHTML = "delete " + fence.name;
                mapElement.parentNode.insertBefore(deleteButton, mapElement.nextSibling);
                fence.deleteID = deleteID;

                function deleteElem(elemName) {
                    var elem = document.getElementById(elemName);
                    elem.parentNode.removeChild(elem);
                }
                deleteButton.onclick = (function removeIndex(fenceToRemove) {
                    deleteElem(fenceToRemove.deleteID);

                    console.log("sending event!");
                    drawnItems.getLayers().forEach(function (shape) {

                        if (fenceToRemove.mode == "circle") {

                            if (shape._mRadius != undefined) {

                                if (shape._mRadius == fenceToRemove._mRadius) {
                                    drawnItems.removeLayer(shape);
                                }
                            }

                        }
                        else {
                            if (shape._bounds != undefined) {

                                if (shape._bounds._northEast.lat == fenceToRemove.shape._bounds._northEast.lat &&
                                    shape._bounds._northEast.lng == fenceToRemove.shape._bounds._northEast.lng &&
                                    shape._bounds._southWest.lat == fenceToRemove.shape._bounds._southWest.lat &&
                                    shape._bounds._southWest.lng == fenceToRemove.shape._bounds._southWest.lng) {
                                    drawnItems.removeLayer(shape);
                                }
                            }

                        }
                    }, this);


                    var evt = $.Event('geofenceDeleted');
                    evt.manager = node;
                    evt.id = fenceToRemove.id;
                    evt.shape = fenceToRemove;
                    $(window).trigger(evt);

                    let arrayIndex = -1;
                    for (var j = 0; j < node.geofenceMap.length; j++) {
                        let fence = node.geofenceMap[j][1];
                        if (fence.id == fenceToRemove.id) {
                            arrayIndex = j;
                            break;
                        }
                    }

                    if (arrayIndex != -1) {
                        node.geofenceMap.splice(arrayIndex, 1);
                        console.log("deleted element " + arrayIndex);
                        console.log(node.geofenceMap);
                    } else {
                        console.log("we failed to delete anything.");
                    }

                }).bind(node, fence);

                var leafletShape;

                if (fence.mode === "circle") {
                    if (fence._mRadius != 0) {
                        leafletShape = L.circle(
                            [fence.centre.latitude, fence.centre.longitude],
                            fence._mRadius
                        );
                        leafletShape.addTo(drawnItems);
                        leafletShape.bindTooltip(fence.name + " ");

                    }

                } else {
                    if (fence.points.length >= 3) {

                        var corners = [];
                        for (var j = 0; j < fence.points.length; j++) {
                            var latlng = [fence.points[j].latitude, fence.points[j].longitude];
                            corners.push(latlng);
                        }
                        leafletShape = L.polygon(
                            corners
                        );

                        leafletShape.addTo(drawnItems);
                        leafletShape.bindTooltip(fence.name);
                    }
                }

                leafletShape.setStyle({color: '#ffffff'});
                leafletShape.setStyle({fillColor: '#42f4d7'});

                shapeList.push(leafletShape);
            }
            if(shapeList.length > 0) {
                map.fitBounds(new L.featureGroup(shapeList).getBounds());
            }
        }

        var n = this;
        console.log("loading leaflet");
        $.getScript('geofence/js/leaflet/leaflet-src.js')
            .done(function (data, textStatus, jqxhr) {
                $.getScript('geofence/js/Leaflet.draw/dist/leaflet.draw.js')
                    .done(function (data, textStatus, jqxhr) {
                        $.getScript('geofence/js/L.GeoSearch/src/js/l.control.geosearch.js')
                            .done(function (data, textStatus, jqxhr) {
                                $.getScript('geofence/js/L.GeoSearch/src/js/l.geosearch.provider.openstreetmap.js')
                                    .done(function (data, textStatus, jqxhr) {
                                        setupMap(n);

                                    })
                                    .fail(function (jqxhr, settings, exception) {
                                        console.log("failed4");
                                        console.log(exception);
                                        console.log(exception.stack);
                                    });
                            })
                            .fail(function (jqxhr, settings, exception) {
                                console.log("failed3");
                                console.log(exception);
                                console.log(exception.stack);
                            });
                    })
                    .fail(function (jqxhr, settings, exception) {
                        console.log("failed2");
                        console.log(exception);
                        console.log(exception.stack);
                    });
            })
            .fail(function (jqxhr, settings, exception) {
                console.log("failed");
                console.log(exception);
                console.log(exception.stack);
            });
    }
});