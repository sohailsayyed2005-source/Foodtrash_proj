<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// ============================================================
// DATABASE CONFIGURATION — Edit these to match your setup
// ============================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'foodrush');
define('DB_USER', 'root');
define('DB_PASS', '');   // Leave empty for XAMPP default
// ============================================================

class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        try {
            $this->conn = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                 PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            $this->conn = null;
        }
    }

    public static function getInstance() {
        if (!self::$instance) self::$instance = new Database();
        return self::$instance;
    }

    public function getConn() { return $this->conn; }
}

// Mock Menu Data
function getMockMenuItems() {
    return [
        ["id"=>1,"name"=>"Margherita Pizza","category"=>"pizza","price"=>299,"rating"=>4.8,"image"=>"🍕","description"=>"Fresh tomatoes, mozzarella, basil","prep_time"=>20,"badge"=>"Bestseller"],
        ["id"=>2,"name"=>"Smoky BBQ Burger","category"=>"burger","price"=>199,"rating"=>4.7,"image"=>"🍔","description"=>"Smoked beef, cheddar, caramelized onions","prep_time"=>15,"badge"=>"Hot"],
        ["id"=>3,"name"=>"Dragon Roll Sushi","category"=>"sushi","price"=>349,"rating"=>4.9,"image"=>"🍣","description"=>"Avocado, shrimp, cucumber, spicy mayo","prep_time"=>25,"badge"=>"Chef's Pick"],
        ["id"=>4,"name"=>"Penne Arrabbiata","category"=>"pasta","price"=>249,"rating"=>4.6,"image"=>"🍝","description"=>"Spicy tomato, garlic, fresh chilli","prep_time"=>18,"badge"=>"Spicy"],
        ["id"=>5,"name"=>"Pad Thai Noodles","category"=>"asian","price"=>229,"rating"=>4.7,"image"=>"🍜","description"=>"Rice noodles, prawns, peanuts, lime","prep_time"=>20,"badge"=>"Popular"],
        ["id"=>6,"name"=>"Chicken Shawarma","category"=>"wraps","price"=>179,"rating"=>4.5,"image"=>"🌯","description"=>"Marinated chicken, garlic sauce, veggies","prep_time"=>12,"badge"=>"Quick"],
        ["id"=>7,"name"=>"Truffle Mac & Cheese","category"=>"comfort","price"=>279,"rating"=>4.8,"image"=>"🧀","description"=>"Four cheese blend, black truffle oil","prep_time"=>22,"badge"=>"Trending"],
        ["id"=>8,"name"=>"Mango Tango Salad","category"=>"salads","price"=>159,"rating"=>4.4,"image"=>"🥗","description"=>"Mixed greens, mango, feta, lime dressing","prep_time"=>10,"badge"=>"Healthy"],
        ["id"=>9,"name"=>"Butter Chicken","category"=>"indian","price"=>269,"rating"=>4.9,"image"=>"🍛","description"=>"Tender chicken in creamy tomato gravy","prep_time"=>25,"badge"=>"Bestseller"],
        ["id"=>10,"name"=>"Chocolate Lava Cake","category"=>"desserts","price"=>149,"rating"=>4.9,"image"=>"🎂","description"=>"Warm molten centre, vanilla ice cream","prep_time"=>15,"badge"=>"Must Try"],
        ["id"=>11,"name"=>"Veggie Supreme Pizza","category"=>"pizza","price"=>269,"rating"=>4.5,"image"=>"🍕","description"=>"Bell peppers, olives, mushrooms, onions","prep_time"=>20,"badge"=>"Veg"],
        ["id"=>12,"name"=>"Korean Fried Chicken","category"=>"asian","price"=>319,"rating"=>4.8,"image"=>"🍗","description"=>"Double-fried, gochujang glaze, pickled daikon","prep_time"=>30,"badge"=>"New"],
    ];
}

function getMockRestaurants() {
    return [
        ["id"=>1,"name"=>"The Pizza Republic","rating"=>4.8,"delivery_time"=>"20-30","min_order"=>199,"cuisine"=>"Italian","image"=>"🍕","offers"=>"30% OFF"],
        ["id"=>2,"name"=>"Burger District","rating"=>4.7,"delivery_time"=>"15-25","min_order"=>149,"cuisine"=>"American","image"=>"🍔","offers"=>"Free Fries"],
        ["id"=>3,"name"=>"Tokyo Garden","rating"=>4.9,"delivery_time"=>"25-35","min_order"=>299,"cuisine"=>"Japanese","image"=>"🍣","offers"=>"15% OFF"],
        ["id"=>4,"name"=>"Spice Route","rating"=>4.8,"delivery_time"=>"20-30","min_order"=>249,"cuisine"=>"Indian","image"=>"🍛","offers"=>"Free Delivery"],
    ];
}

// Router
$action = $_GET['action'] ?? 'menu';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {

    case 'menu':
        echo json_encode(['success'=>true,'data'=>getMockMenuItems(),'count'=>12]);
        break;

    case 'restaurants':
        echo json_encode(['success'=>true,'data'=>getMockRestaurants()]);
        break;

    // ── PLACE ORDER (saves to MySQL) ──────────────────────────
    case 'place_order':
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        $required = ['customer_name','phone','email','address','city','pincode','payment_method','items','total'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                echo json_encode(['success'=>false,'message'=>"Field '$field' is required."]);
                exit;
            }
        }

        // Sanitise
        $customer_name   = htmlspecialchars(trim($input['customer_name']));
        $phone           = htmlspecialchars(trim($input['phone']));
        $email           = htmlspecialchars(trim($input['email']));
        $address         = htmlspecialchars(trim($input['address']));
        $city            = htmlspecialchars(trim($input['city']));
        $pincode         = htmlspecialchars(trim($input['pincode']));
        $payment_method  = htmlspecialchars(trim($input['payment_method']));
        $items           = $input['items'];           // array of cart items
        $subtotal        = floatval($input['total']);
        $delivery_fee    = 40;
        $discount        = floatval($input['discount'] ?? 0);
        $total_amount    = $subtotal + $delivery_fee - $discount;
        $coupon_code     = $input['coupon'] ?? null;
        $special_note    = htmlspecialchars(trim($input['note'] ?? ''));
        $order_ref       = 'FR' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 7));
        $eta             = rand(25, 45);
        $items_json      = json_encode($items);

        $db = Database::getInstance()->getConn();

        if (!$db) {
            // DB not connected — still return success with mock order ID
            echo json_encode([
                'success'  => true,
                'order_id' => $order_ref,
                'message'  => 'Order received! (Database not connected — run on XAMPP to save to phpMyAdmin)',
                'eta'      => $eta,
                'status'   => 'confirmed',
                'db_saved' => false,
            ]);
            exit;
        }

        try {
            // Insert into orders table
            $stmt = $db->prepare("
                INSERT INTO orders
                    (order_ref, customer_name, phone, email, delivery_address, city, pincode,
                     order_items, subtotal, delivery_fee, discount, total_amount,
                     payment_method, coupon_code, special_instructions, estimated_delivery, status)
                VALUES
                    (:ref, :name, :phone, :email, :address, :city, :pincode,
                     :items, :subtotal, :delivery_fee, :discount, :total,
                     :payment, :coupon, :note, :eta, 'pending')
            ");
            $stmt->execute([
                ':ref'          => $order_ref,
                ':name'         => $customer_name,
                ':phone'        => $phone,
                ':email'        => $email,
                ':address'      => $address,
                ':city'         => $city,
                ':pincode'      => $pincode,
                ':items'        => $items_json,
                ':subtotal'     => $subtotal,
                ':delivery_fee' => $delivery_fee,
                ':discount'     => $discount,
                ':total'        => $total_amount,
                ':payment'      => $payment_method,
                ':coupon'       => $coupon_code,
                ':note'         => $special_note,
                ':eta'          => $eta,
            ]);

            $order_db_id = $db->lastInsertId();

            echo json_encode([
                'success'    => true,
                'order_id'   => $order_ref,
                'order_db_id'=> $order_db_id,
                'message'    => 'Order placed successfully!',
                'eta'        => $eta,
                'status'     => 'confirmed',
                'db_saved'   => true,
                'timestamp'  => date('Y-m-d H:i:s'),
            ]);

        } catch (PDOException $e) {
            echo json_encode(['success'=>false,'message'=>'Database error: '.$e->getMessage()]);
        }
        break;

    // ── TRACK ORDER ───────────────────────────────────────────
    case 'track_order':
        $order_id = $_GET['order_id'] ?? '';
        $db = Database::getInstance()->getConn();

        if ($db && $order_id) {
            $stmt = $db->prepare("SELECT * FROM orders WHERE order_ref = ?");
            $stmt->execute([$order_id]);
            $order = $stmt->fetch();
            if ($order) {
                echo json_encode(['success'=>true,'order_id'=>$order_id,'status'=>$order['status'],'eta'=>$order['estimated_delivery'].' mins']);
                break;
            }
        }
        // fallback
        $statuses = ['Order Placed','Preparing','Out for Delivery','Delivered'];
        echo json_encode(['success'=>true,'order_id'=>$order_id,'status'=>$statuses[array_rand($statuses)],'eta'=>rand(5,40).' mins','driver'=>'Ravi Kumar','phone'=>'+91 98765 43210']);
        break;

    case 'search':
        $q = strtolower($_GET['q'] ?? '');
        $items = getMockMenuItems();
        $results = array_filter($items, fn($i) =>
            str_contains(strtolower($i['name']), $q) ||
            str_contains(strtolower($i['category']), $q) ||
            str_contains(strtolower($i['description']), $q)
        );
        echo json_encode(['success'=>true,'data'=>array_values($results)]);
        break;

    case 'reviews':
        $reviews = [
            ["name"=>"Priya S.","rating"=>5,"comment"=>"Best delivery in town! Food was piping hot and absolutely delicious.","time"=>"2 hours ago","avatar"=>"PS"],
            ["name"=>"Arjun M.","rating"=>5,"comment"=>"Ordered the Butter Chicken — absolutely phenomenal. 10/10!","time"=>"Yesterday","avatar"=>"AM"],
            ["name"=>"Sneha K.","rating"=>4,"comment"=>"Great variety, quick delivery. Will definitely order again!","time"=>"3 days ago","avatar"=>"SK"],
        ];
        echo json_encode(['success'=>true,'data'=>$reviews]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['success'=>false,'message'=>'Action not found']);
}
?>
