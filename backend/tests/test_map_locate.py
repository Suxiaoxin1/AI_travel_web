from app.routers.map_routes import normalize_poi_locate, _poi_name_score
from fastapi import HTTPException


def test_poi_name_score_prefers_exact():
    assert _poi_name_score('厦门大学', '厦门大学') > _poi_name_score('厦门大学', '厦门大学附属医院')
    assert _poi_name_score('鼓浪屿', '鼓浪屿风景名胜区') >= 80


def test_normalize_poi_locate_picks_best_name_match():
    payload = {
        'pois': [
            {'name': '厦门大学附属医院', 'location': '118.100000,24.450000', 'cityname': '厦门市', 'address': '医院路'},
            {'name': '厦门大学', 'location': '118.096480,24.437550', 'cityname': '厦门市', 'address': '思明南路'},
        ]
    }
    result = normalize_poi_locate(payload, '厦门大学')
    assert result['name'] == '厦门大学'
    assert abs(result['lng'] - 118.09648) < 1e-6
    assert abs(result['lat'] - 24.43755) < 1e-6
    assert result['source'] == 'amap_poi'


def test_normalize_poi_locate_empty_raises():
    try:
        normalize_poi_locate({'pois': []}, '不存在')
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError('expected 404')
