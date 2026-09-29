from fastapi import HTTPException

from app.routers.map_routes import normalize_transit


def test_normalize_transit_returns_first_recommended_plan():
    result = normalize_transit({
        'route': {
            'transits': [{
                'distance': '12400',
                'duration': '2940',
                'cost': '5',
                'walking_distance': '760',
                'segments': [
                    {
                        'walking': {'distance': '320'},
                        'bus': {'buslines': [{'name': '地铁 3 号线', 'duration': '1200'}]},
                    },
                    {
                        'walking': {'distance': '440'},
                        'bus': {'buslines': [{'name': '地铁 1 号线', 'duration': '960'}]},
                    },
                ],
            }],
        },
    })

    assert result == {
        'mode': 'transit',
        'distance': 12400.0,
        'time': 2940.0,
        'cost': 5.0,
        'walking_distance': 760.0,
        'transfers': 1,
        'steps': ['步行 320 米', '乘坐 地铁 3 号线（约 20 分钟）', '步行 440 米', '乘坐 地铁 1 号线（约 16 分钟）'],
    }


def test_normalize_transit_rejects_empty_result():
    try:
        normalize_transit({'route': {'transits': []}})
    except HTTPException as exc:
        assert exc.status_code == 502
        assert exc.detail == '高德未返回可用公交方案'
    else:
        raise AssertionError('expected a missing-transit error')

