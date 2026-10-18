<?php
// ============================================================
// admin_orders.php — View & Manage All Orders from phpMyAdmin
// URL: http://localhost/foodrush/php/admin_orders.php
// ============================================================

// ── DB config (keep in sync with api.php) ──────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'foodrush');
define('DB_USER', 'root');
define('DB_PASS', '');
// ───────────────────────────────────────────────────────────

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $db_ok = true;
} catch (PDOException $e) {
    $db_ok    = false;
    $db_error = $e->getMessage();
}

// Handle order status update
if ($db_ok && isset($_GET['set_status'], $_GET['id'])) {
    $allowed   = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];
    $newStatus = $_GET['set_status'];
    $id        = intval($_GET['id']);
    if (in_array($newStatus, $allowed)) {
        $pdo->prepare("UPDATE orders SET status=? WHERE id=?")->execute([$newStatus, $id]);
    }
    header("Location: admin_orders.php");
    exit;
}

// Fetch all orders newest first
$orders = [];
$stats  = ['total'=>0,'revenue'=>0,'pending'=>0,'delivered'=>0];
if ($db_ok) {
    $orders = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC")->fetchAll();
    $stats['total']     = count($orders);
    $stats['revenue']   = array_sum(array_column($orders, 'total_amount'));
    $stats['pending']   = count(array_filter($orders, fn($o) => $o['status'] === 'pending'));
    $stats['delivered'] = count(array_filter($orders, fn($o) => $o['status'] === 'delivered'));
}

function statusBadge(string $s): string {
    $map = [
        'pending'          => ['🕐', '#ffd166',  'rgba(255,209,102,0.15)'],
        'confirmed'        => ['✅', '#2a9d8f',  'rgba(42,157,143,0.15)'],
        'preparing'        => ['👨‍🍳','#ff6b35', 'rgba(255,107,53,0.15)'],
        'out_for_delivery' => ['🛵', '#6495ed',  'rgba(100,149,237,0.15)'],
        'delivered'        => ['🎉', '#2eddc8',  'rgba(46,221,200,0.15)'],
        'cancelled'        => ['✕',  '#e63946',  'rgba(230,57,70,0.15)'],
    ];
    [$icon, $color, $bg] = $map[$s] ?? ['?', '#888', 'rgba(136,136,136,0.15)'];
    $label = ucwords(str_replace('_', ' ', $s));
    return "<span style='background:$bg;color:$color;padding:4px 12px;border-radius:20px;font-size:.75rem;font-weight:700;white-space:nowrap'>$icon $label</span>";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Orders — FoodRush</title>
  <style>
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',sans-serif; background:#0a0a14; color:#eee; min-height:100vh; }

    .admin-header {
      background: linear-gradient(135deg, #ff6b35, #e63946);
      padding: 0 40px; height: 66px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 4px 24px rgba(230,57,70,.35);
    }
    .admin-header h1 { font-size: 1.4rem; color: #fff; }
    .admin-header a  { color: rgba(255,255,255,.8); text-decoration: none; font-size: .85rem; }
    .admin-header a:hover { color: #fff; }

    .stats { display: flex; gap: 18px; padding: 28px 40px; flex-wrap: wrap; }
    .stat-card {
      background: #1a1a2e; border-radius: 14px; padding: 20px 28px;
      border: 1px solid rgba(255,107,53,.15); min-width: 160px; text-align: center;
    }
    .stat-card .num { font-size: 2rem; font-weight: 700; color: #ff6b35; }
    .stat-card .lbl { font-size: .78rem; color: #888; margin-top: 4px; }

    .db-error {
      margin: 20px 40px; padding: 20px 24px;
      background: rgba(230,57,70,.1); border: 1px solid rgba(230,57,70,.4);
      border-radius: 12px; color: #e63946; line-height: 1.7;
    }
    .db-error code { display: block; margin-top: 10px; font-size: .8rem; color: #aaa; background: rgba(0,0,0,.3); padding: 10px; border-radius: 6px; }

    .table-wrap { padding: 0 40px 50px; overflow-x: auto; }
    .section-title { font-size: 1.1rem; color: #ffd166; margin-bottom: 16px; }

    table { width: 100%; border-collapse: collapse; background: #1a1a2e; border-radius: 14px; overflow: hidden; font-size: .84rem; }
    thead { background: linear-gradient(135deg, #ff6b35, #e63946); }
    th { padding: 13px 14px; text-align: left; color: #fff; font-weight: 600; white-space: nowrap; }
    td { padding: 13px 14px; border-bottom: 1px solid rgba(255,255,255,.05); vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,107,53,.04); }

    .items-list { max-width: 220px; font-size: .78rem; color: #bbb; line-height: 1.8; }

    select.status-sel {
      background: #0a0a14; color: #eee; border: 1px solid rgba(255,107,53,.4);
      border-radius: 8px; padding: 5px 8px; font-size: .78rem; cursor: pointer; margin-top: 6px;
    }
    .upd-btn {
      margin-top: 6px; padding: 5px 14px; background: #ff6b35; color: #fff;
      border: none; border-radius: 6px; cursor: pointer; font-size: .75rem;
    }
    .upd-btn:hover { background: #e63946; }

    .empty { text-align: center; padding: 80px 20px; color: #555; }
    .empty .icon { font-size: 3rem; margin-bottom: 16px; }

    @media (max-width: 768px) {
      .admin-header, .stats, .table-wrap { padding-left: 16px; padding-right: 16px; }
    }
  </style>
</head>
<body>

<header class="admin-header">
  <h1>🍕 FoodRush — Admin Orders</h1>
  <a href="../index.html">← Back to Website</a>
</header>

<?php if (!$db_ok): ?>
<div class="db-error">
  <strong>⚠️ Database not connected.</strong><br>
  Make sure XAMPP MySQL is running and you have imported <strong>php/schema.sql</strong>.<br>
  Also check that DB_USER / DB_PASS in <code>php/api.php</code> and <code>php/admin_orders.php</code> match your phpMyAdmin credentials.
  <code><?= htmlspecialchars($db_error ?? '') ?></code>
</div>

<?php else: ?>

<div class="stats">
  <div class="stat-card"><div class="num"><?= $stats['total'] ?></div><div class="lbl">Total Orders</div></div>
  <div class="stat-card"><div class="num">₹<?= number_format($stats['revenue'], 0) ?></div><div class="lbl">Total Revenue</div></div>
  <div class="stat-card"><div class="num"><?= $stats['pending'] ?></div><div class="lbl">Pending</div></div>
  <div class="stat-card"><div class="num"><?= $stats['delivered'] ?></div><div class="lbl">Delivered</div></div>
</div>

<div class="table-wrap">
  <div class="section-title">📋 All Customer Orders (newest first)</div>

  <?php if (empty($orders)): ?>
    <div class="empty">
      <div class="icon">📭</div>
      <p>No orders yet. Place a test order on the website first!</p>
    </div>
  <?php else: ?>
  <table>
    <thead>
      <tr>
        <th>Order Ref</th>
        <th>Customer</th>
        <th>Contact</th>
        <th>Delivery Address</th>
        <th>Items Ordered</th>
        <th>Amount</th>
        <th>Payment</th>
        <th>Date & Time</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
    <?php foreach ($orders as $o):
        $items = json_decode($o['order_items'], true) ?? [];
    ?>
      <tr>
        <td><strong style="color:#ffd166"><?= htmlspecialchars($o['order_ref']) ?></strong></td>
        <td><strong><?= htmlspecialchars($o['customer_name']) ?></strong></td>
        <td>
          <?= htmlspecialchars($o['phone']) ?><br>
          <small style="color:#888"><?= htmlspecialchars($o['email']) ?></small>
        </td>
        <td style="max-width:180px">
          <?= htmlspecialchars($o['delivery_address']) ?>,<br>
          <?= htmlspecialchars($o['city']) ?> — <?= htmlspecialchars($o['pincode']) ?>
          <?php if (!empty($o['special_instructions'])): ?>
            <br><small style="color:#888;font-style:italic">📝 <?= htmlspecialchars($o['special_instructions']) ?></small>
          <?php endif; ?>
        </td>
        <td>
          <div class="items-list">
          <?php foreach ($items as $item): ?>
            <?= htmlspecialchars($item['image'] ?? '') ?>
            <?= htmlspecialchars($item['name'] ?? '') ?>
            ×<?= intval($item['qty'] ?? 1) ?>
            — ₹<?= intval(($item['price'] ?? 0) * ($item['qty'] ?? 1)) ?><br>
          <?php endforeach; ?>
          <?php if (!empty($o['coupon_code'])): ?>
            <small style="color:#2a9d8f">🎟 Coupon: <?= htmlspecialchars($o['coupon_code']) ?></small>
          <?php endif; ?>
          </div>
        </td>
        <td>
          <strong style="color:#ffd166">₹<?= number_format($o['total_amount'], 2) ?></strong><br>
          <small style="color:#555">+₹<?= intval($o['delivery_fee']) ?> delivery</small>
          <?php if ($o['discount'] > 0): ?>
            <br><small style="color:#2a9d8f">−₹<?= intval($o['discount']) ?> discount</small>
          <?php endif; ?>
        </td>
        <td><?= htmlspecialchars($o['payment_method']) ?></td>
        <td style="white-space:nowrap">
          <?= date('d M Y', strtotime($o['created_at'])) ?><br>
          <small style="color:#888"><?= date('H:i:s', strtotime($o['created_at'])) ?></small>
        </td>
        <td>
          <?= statusBadge($o['status']) ?>
          <form method="GET" style="margin-top:8px">
            <input type="hidden" name="id" value="<?= $o['id'] ?>">
            <select name="set_status" class="status-sel">
              <?php foreach (['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'] as $st): ?>
                <option value="<?= $st ?>" <?= $o['status'] === $st ? 'selected' : '' ?>>
                  <?= ucwords(str_replace('_', ' ', $st)) ?>
                </option>
              <?php endforeach; ?>
            </select><br>
            <button type="submit" class="upd-btn">Update ↑</button>
          </form>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>

<?php endif; ?>
</body>
</html>
