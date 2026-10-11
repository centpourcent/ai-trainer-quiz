/* 题库层：支持多个分区。当前只启用一个分区（四级理论题库 500 题），
   但多分区框架与 essence 加载分支全部保留，以后要加回题库只需往 SETS 里加一条。
   对外接口（load/all/meta/byId/filter/countBy/build/sectionGroups/MODES）保持不变。 */
window.Bank = (function () {
  'use strict';

  var SETS = [
    { key: '', title: '四级理论题库', sub: '500 题 · 正式版', files: ['data/questions-now.json'] }
  ];

  var _files = {};     // 文件路径 -> 已加载的题库 JSON
  var _pending = {};   // 文件路径 -> 正在加载的 Promise
  var _byId = {};      // 全局 id -> 题目（跨分区，供错题本/收藏夹解析）
  var _cur = null;     // 当前分区 key
  var _list = [];      // 当前分区的题目数组
  var _meta = null;    // 当前分区的 meta
  var _ess = null;     // 精华题清单
  var _essById = {};   // 精华题视图下的题目副本（ch/sec 用统一考纲章节）
  var _idIdx = {};
  var _idIdxKey = null;

  function def(key) {
    for (var i = 0; i < SETS.length; i++) {
      if (SETS[i].key === key) return SETS[i];
    }
    return null;
  }

  function savedKey() {
    if (typeof Store === 'undefined' || !Store.settings) return '';
    var s = Store.settings();
    if (def(s.set)) return s.set;
    // 老用户可能存着已下线分区的 key（如 n9 / ess），顺手清掉，别让脏值常驻
    if (s.set) Store.saveSettings({ set: '' });
    return '';
  }

  function activeKey() {
    if (_cur === null) _cur = savedKey();
    return _cur;
  }

  function loadFile(path) {
    if (_files[path]) return Promise.resolve(_files[path]);
    if (_pending[path]) return _pending[path];
    var p = fetch(path, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('题库文件读取失败（HTTP ' + r.status + '）');
        return r.json();
      })
      .then(function (json) {
        _files[path] = json;
        (json.questions || []).forEach(function (q) { _byId[q.id] = q; });
        return json;
      })
      .catch(function (err) {
        delete _pending[path];
        if (location.protocol === 'file:') {
          throw new Error('直接双击打开 HTML 时浏览器不允许读取题库文件。请用本地静态服务器预览：python3 -m http.server');
        }
        throw err;
      });
    _pending[path] = p;
    return p;
  }

  function countTypes(list) {
    var out = { judge: 0, single: 0, multi: 0 };
    list.forEach(function (q) { out[q.type] = (out[q.type] || 0) + 1; });
    return out;
  }

  function sourceMix(list) {
    var out = {};
    list.forEach(function (q) { out[q.src] = (out[q.src] || 0) + 1; });
    return out;
  }

  function applySet(d, list, meta) {
    var src = meta || {};
    _list = list;
    _meta = Object.assign({}, src, {
      key: d.key,
      title: d.title,
      total: list.length,
      counts: src.counts || countTypes(list),
      typeCounts: countTypes(list),
      answerSources: src.answerSources || sourceMix(list)
    });
    _idIdxKey = null;
  }

  /* 切换分区：返回 Promise<{meta, questions}> */
  function useSet(key) {
    var d = def(key) || def('');
    return Promise.all(d.files.map(loadFile)).then(function (banks) {
      if (d.essence) {
        return loadFile(d.essence).then(function (ess) {
          _ess = ess;
          var allow = {};
          (ess.ids || []).forEach(function (id) { allow[id] = true; });
          var seen = {};
          var list = [];
          _essById = {};
          banks.forEach(function (b) {
            (b.questions || []).forEach(function (q) {
              if (!allow[q.id] || seen[q.id]) return;
              seen[q.id] = true;
              var g = (ess.groupOf && ess.groupOf[q.id]) || null;
              var copy = g ? Object.assign({}, q, { ch: g[0], sec: g[1] }) : q;
              _essById[q.id] = copy;
              list.push(copy);
            });
          });
          var pos = {};
          (ess.ids || []).forEach(function (id, i) { pos[id] = i; });
          list.sort(function (a, b) { return (pos[a.id] || 0) - (pos[b.id] || 0); });
          applySet(d, list, { essence: true });
          _cur = d.key;
          return current();
        });
      }
      applySet(d, banks[0].questions.slice(), banks[0].meta);
      _cur = d.key;
      return current();
    });
  }

  /* 兼容旧接口：加载当前分区（默认分区保持为等级认定题库） */
  function load() { return useSet(activeKey()); }

  /* 预加载所有分区的题目文件（错题本/收藏夹需要跨分区解析 id，不加载精华清单） */
  function preloadAll() {
    var paths = {};
    SETS.forEach(function (s) {
      (s.files || []).forEach(function (p) { paths[p] = true; });
    });
    return Promise.all(Object.keys(paths).map(loadFile));
  }

  function current() { return { meta: _meta, questions: _list }; }
  function all() { return _list; }
  function meta() { return _meta; }
  function setKey() { return activeKey(); }
  function setDef(key) { return def(key === undefined ? activeKey() : key); }
  function essence() { return _ess; }

  function byId(id) {
    if (activeKey() === 'ess' && _essById[id]) return _essById[id];
    return _byId[id] || null;
  }

  /* 当前分区内实际出现的级别，升序。用于取代各处写死的 [3, 4] */
  function levels() {
    var seen = {};
    _list.forEach(function (q) { seen[q.lv] = true; });
    return Object.keys(seen).map(Number).sort();
  }

  /* 只统计已加载题库里存在的 id：localStorage 里可能残留其他题库的旧 id，
     直接数长度会让"首页计数"和"错题页列表"对不上 */
  function countKnown(ids) {
    var n = 0;
    (ids || []).forEach(function (id) { if (_byId[id]) n += 1; });
    return n;
  }

  function idIndex() {
    var k = activeKey();
    if (_idIdxKey !== k) {
      _idIdx = {};
      _list.forEach(function (q) { _idIdx[q.id] = q; });
      _idIdxKey = k;
    }
    return _idIdx;
  }

  /* 按级别 + 题型过滤（当前分区内） */
  function filter(f) {
    f = f || {};
    var lvls = f.levels && f.levels.length ? f.levels : levels();
    var types = f.types && f.types.length ? f.types : ['judge', 'single', 'multi'];
    var secs = f.secs && f.secs.length ? f.secs : null;
    return _list.filter(function (q) {
      if (lvls.indexOf(q.lv) < 0 || types.indexOf(q.type) < 0) return false;
      if (secs && secs.indexOf(secKey(q)) < 0) return false;
      return true;
    });
  }

  function secKey(q) { return q.ch + '::' + q.sec; }

  /* 章节列表（按题库里的官方顺序，章内按节顺序） */
  function sectionList(lvls) {
    lvls = lvls && lvls.length ? lvls : levels();
    var seen = {};
    var list = [];
    _list.forEach(function (q) {
      if (!q.ch || lvls.indexOf(q.lv) < 0) return;
      var key = secKey(q);
      var item = seen[key];
      if (!item) {
        item = seen[key] = { key: key, ch: q.ch, sec: q.sec, lv: {}, total: 0 };
        list.push(item);
      }
      item.total += 1;
      item.lv[q.lv] = (item.lv[q.lv] || 0) + 1;
    });
    return list;
  }

  /* 按章分组的章节列表，附带当前筛选条件下的题量 */
  function sectionGroups(f) {
    f = f || {};
    var list = sectionList(f.levels);
    var groups = [];
    var index = {};
    list.forEach(function (item) {
      var g = index[item.ch];
      if (!g) {
        g = index[item.ch] = { ch: item.ch, items: [] };
        groups.push(g);
      }
      item.count = filter({
        levels: f.levels, types: f.types, secs: [item.key]
      }).length;
      g.items.push(item);
    });
    return groups;
  }

  function countBy(f) {
    var pool = filter(f);
    var out = { total: pool.length, '3': 0, '4': 0, judge: 0, single: 0, multi: 0 };
    pool.forEach(function (q) {
      out[q.lv] += 1;
      out[q.type] += 1;
    });
    return out;
  }

  /* 组卷：返回题目 id 数组 */
  function build(opts) {
    opts = opts || {};
    var mode = opts.mode || 'order';
    var pool = filter(opts);
    var stats = Store.stats();
    var list;

    if (mode === 'wrong') {
      var wids = {};
      (setKey() === 'ess' ? Store.essWrongIds() : Store.wrongIds()).forEach(function (id) { wids[id] = true; });
      list = pool.filter(function (q) { return wids[q.id]; });
    } else if (mode === 'fav') {
      var fids = {};
      Store.favIds().forEach(function (id) { fids[id] = true; });
      list = pool.filter(function (q) { return fids[q.id]; });
    } else if (mode === 'unseen') {
      var fresh = pool.filter(function (q) { return !stats[q.id]; });
      var seen = pool.filter(function (q) { return !!stats[q.id]; });
      list = fresh.concat(UI.shuffle(seen));
    } else if (mode === 'weak') {
      // 错过的题优先，其次是从没做过的，最后是答对过的
      var wrong = [], fresh2 = [], right = [];
      UI.shuffle(pool).forEach(function (q) {
        var s = stats[q.id];
        if (s && s.w > 0) wrong.push(q);
        else if (!s) fresh2.push(q);
        else right.push(q);
      });
      list = wrong.concat(fresh2, right);
    } else if (mode === 'random') {
      list = UI.shuffle(pool);
    } else {
      list = pool.slice();
    }

    var ids = list.map(function (q) { return q.id; });
    var n = opts.count || 0;
    if (n > 0 && ids.length > n) ids = ids.slice(0, n);
    return ids;
  }

  var MODES = [
    { key: 'order', label: '顺序练习', hint: '按题库原顺序' },
    { key: 'random', label: '随机练习', hint: '打乱全部题目' },
    { key: 'weak', label: '智能优先', hint: '错题→没做过→做过' },
    { key: 'unseen', label: '只刷没做过的', hint: '跳过已做过的题' },
    { key: 'wrong', label: '只刷错题', hint: '来自错题本' },
    { key: 'fav', label: '只刷收藏', hint: '来自收藏夹' }
  ];

  return {
    SETS: SETS,
    load: load,
    useSet: useSet,
    preloadAll: preloadAll,
    current: current,
    setKey: setKey,
    setDef: setDef,
    essence: essence,
    all: all,
    meta: meta,
    byId: byId,
    levels: levels,
    countKnown: countKnown,
    idIndex: idIndex,
    filter: filter,
    countBy: countBy,
    build: build,
    secKey: secKey,
    sectionList: sectionList,
    sectionGroups: sectionGroups,
    MODES: MODES
  };
})();
