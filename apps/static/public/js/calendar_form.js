// グローバルスコープでinitMapを定義
async function initializeMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    
    const mapElement = document.getElementById('map');
    const defaultPosition = { lat: 35.6812362, lng: 139.7671248 };

    const map = new Map(mapElement, {
        center: defaultPosition,
        zoom: 13,
        mapId: 'DEMO_MAP_ID'
    });

    // Advanced Markerの設定
    const markerElement = new AdvancedMarkerElement({
        map: map,
        position: defaultPosition,
    });

    // マップのクリックイベントを修正
    map.addListener('mousedown', function(e) {
        // CTRLキーが押されていて、右クリックの場合のみ処理を実行
        if (e.ctrlKey && e.domEvent.button === 2) {
            const latLng = e.latLng;
            markerElement.position = latLng;
            document.getElementById('lat').value = latLng.lat();
            document.getElementById('lng').value = latLng.lng();
            updateLocationAddress(latLng);
        }
    });

    // 右クリックメニューを無効化
    map.addListener('contextmenu', function(e) {
        e.domEvent.preventDefault();
    });

    // 現在位置の取得
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);
            markerElement.position = pos;
            document.getElementById('lat').value = pos.lat;
            document.getElementById('lng').value = pos.lng;
            updateLocationAddress(pos);
        });
    }
}

// initMap関数をグローバルスコープで定義
window.initMap = function() {
    // Google Maps APIのロード完了後にマップを初期化
    initializeMap().catch(e => {
        console.error("Error initializing map:", e);
    });
};

function updateLocationAddress(latLng) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {
                document.getElementById('location').value = results[0].formatted_address;
            }
        }
    });
}

function geocodeAddress() {
    const address = document.getElementById('location').value;
    if (!address) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, async function(results, status) {
        if (status === 'OK') {
            const { Map } = await google.maps.importLibrary("maps");
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
            
            const map = new Map(document.getElementById('map'), {
                center: results[0].geometry.location,
                zoom: 13,
                mapId: 'DEMO_MAP_ID'
            });
            
            const markerElement = new AdvancedMarkerElement({
                map: map,
                position: results[0].geometry.location
            });
            
            document.getElementById('lat').value = results[0].geometry.location.lat();
            document.getElementById('lng').value = results[0].geometry.location.lng();
        }
    });
}