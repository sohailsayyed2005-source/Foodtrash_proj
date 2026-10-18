<?php
// auth.php — Handles user registration and login
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

$input  = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

function getDB() {
    static $pdo = null;
    if (!$pdo) {
        try {
            $pdo = new PDO('mysql:host=localhost;dbname=foodrush;charset=utf8', 'root', '', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            return null;
        }
    }
    return $pdo;
}

switch ($action) {
    case 'register':
        $name  = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $pass  = $input['password'] ?? '';

        if (!$name || !$email || !$pass) {
            echo json_encode(['success' => false, 'message' => 'Name, email, and password are required.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
            exit;
        }

        if (strlen($pass) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
            exit;
        }

        $db = getDB();
        if (!$db) {
            // Mock response when DB not connected
            echo json_encode(['success' => true, 'message' => 'Account created! (Demo mode — DB not connected)', 'user' => ['name' => $name, 'email' => $email]]);
            exit;
        }

        $exists = $db->prepare('SELECT id FROM users WHERE email = ?');
        $exists->execute([$email]);
        if ($exists->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Email already registered.']);
            exit;
        }

        $hash = password_hash($pass, PASSWORD_DEFAULT);
        $stmt = $db->prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $email, $phone, $hash]);
        $userId = $db->lastInsertId();

        $_SESSION['user_id']   = $userId;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email']= $email;

        echo json_encode(['success' => true, 'message' => 'Account created successfully!', 'user' => ['id' => $userId, 'name' => $name, 'email' => $email]]);
        break;

    case 'login':
        $email = trim($input['email'] ?? '');
        $pass  = $input['password'] ?? '';

        if (!$email || !$pass) {
            echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
            exit;
        }

        $db = getDB();
        if (!$db) {
            // Demo mode
            echo json_encode(['success' => true, 'message' => 'Logged in! (Demo mode)', 'user' => ['name' => 'Guest User', 'email' => $email]]);
            exit;
        }

        $stmt = $db->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($pass, $user['password_hash'])) {
            echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
            exit;
        }

        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email']= $user['email'];

        echo json_encode(['success' => true, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]]);
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logged out.']);
        break;

    case 'me':
        if (isset($_SESSION['user_id'])) {
            echo json_encode(['success' => true, 'user' => ['id' => $_SESSION['user_id'], 'name' => $_SESSION['user_name'], 'email' => $_SESSION['user_email']]]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Not logged in.']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}
?>
