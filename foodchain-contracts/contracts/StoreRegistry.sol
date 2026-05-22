// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./UserRegistry.sol";

/**
 * @title StoreRegistry
 * @author FoodChain Team
 * @notice Mengelola katalog produk toko mitra dan sistem reputasi on-chain.
 *         Reputasi bersifat transparan dan tidak dapat dimanipulasi.
 */
contract StoreRegistry is Ownable, ReentrancyGuard {

    UserRegistry public immutable userRegistry;

    // ─── CONSTANTS ────────────────────────────────────────────────
    uint256 public constant INITIAL_REPUTATION = 100;
    uint256 public constant MIN_REPUTATION     = 50;   // Di bawah ini → auto suspend
    uint256 public constant REP_BONUS_HIGH     = 10;   // Rating 4-5
    uint256 public constant REP_BONUS_LOW      = 5;    // Rating 3
    uint256 public constant REP_PENALTY_DISPUTE = 50;  // Kalah dispute
    uint256 public constant REP_PENALTY_EXPIRED = 80;  // Produk kedaluwarsa

    // ─── STRUCTS ─────────────────────────────────────────────────
    struct Product {
        uint256 productId;
        address storeAddress;
        string name;
        uint256 price;              // Dalam unit terkecil stablecoin (6 desimal)
        string imageHash;           // IPFS hash foto produk
        string certificationHash;   // IPFS hash sertifikat BPOM/Halal
        uint256 expiryDate;         // Unix timestamp tanggal kedaluwarsa
        bool isAvailable;
        uint256 stock;
        uint256 listedAt;
    }

    struct StoreReputation {
        uint256 reputationScore;
        uint256 totalOrders;
        uint256 successfulOrders;
        uint256 totalDisputes;
        uint256 disputesLost;
        bool isSuspended;
    }

    // ─── STATE VARIABLES ─────────────────────────────────────────
    uint256 private _productIdCounter;
    mapping(uint256 => Product) public products;
    mapping(address => uint256[]) public storeProducts;
    mapping(address => StoreReputation) public reputations;
    address public escrowContract;  // Hanya DonationEscrow yang dapat update reputasi

    // ─── EVENTS ──────────────────────────────────────────────────
    event ProductListed(uint256 indexed productId, address indexed store, string name, uint256 price);
    event ProductUpdated(uint256 indexed productId, bool isAvailable, uint256 stock);
    event ReputationUpdated(address indexed store, uint256 newScore, int256 change);
    event StoreSuspended(address indexed store, string reason);
    event EscrowContractSet(address indexed escrow);

    // ─── MODIFIERS ───────────────────────────────────────────────
    modifier onlyVerifiedStore() {
        require(
            userRegistry.isVerified(msg.sender) &&
            userRegistry.getRole(msg.sender) == UserRegistry.Role.STORE,
            "StoreRegistry: not a verified store"
        );
        require(
            !reputations[msg.sender].isSuspended,
            "StoreRegistry: store is suspended"
        );
        _;
    }

    modifier onlyEscrow() {
        require(msg.sender == escrowContract, "StoreRegistry: caller is not escrow");
        _;
    }

    // ─── CONSTRUCTOR ─────────────────────────────────────────────
    constructor(address _userRegistry) Ownable(msg.sender) {
        userRegistry = UserRegistry(_userRegistry);
    }

    // ─── ADMIN FUNCTIONS ─────────────────────────────────────────

    function setEscrowContract(address _escrow) external onlyOwner {
        require(_escrow != address(0), "StoreRegistry: zero address");
        escrowContract = _escrow;
        emit EscrowContractSet(_escrow);
    }

    function initStoreReputation(address _store) external onlyOwner {
        if (reputations[_store].reputationScore == 0) {
            reputations[_store] = StoreReputation({
                reputationScore: INITIAL_REPUTATION,
                totalOrders: 0,
                successfulOrders: 0,
                totalDisputes: 0,
                disputesLost: 0,
                isSuspended: false
            });
        }
    }

    // ─── STORE FUNCTIONS ─────────────────────────────────────────

    /**
     * @notice Mendaftarkan produk baru ke katalog on-chain.
     *         Data produk bersifat immutable setelah dicatat.
     */
    function listProduct(
        string calldata _name,
        uint256 _price,
        string calldata _imageHash,
        string calldata _certificationHash,
        uint256 _expiryDate,
        uint256 _stock
    ) external onlyVerifiedStore nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "StoreRegistry: name required");
        require(_price > 0, "StoreRegistry: price must be > 0");
        require(_expiryDate > block.timestamp, "StoreRegistry: product already expired");
        require(_stock > 0, "StoreRegistry: stock must be > 0");

        _productIdCounter++;
        uint256 newId = _productIdCounter;

        products[newId] = Product({
            productId: newId,
            storeAddress: msg.sender,
            name: _name,
            price: _price,
            imageHash: _imageHash,
            certificationHash: _certificationHash,
            expiryDate: _expiryDate,
            isAvailable: true,
            stock: _stock,
            listedAt: block.timestamp
        });

        storeProducts[msg.sender].push(newId);

        emit ProductListed(newId, msg.sender, _name, _price);
        return newId;
    }

    /**
     * @notice Memperbarui ketersediaan dan stok produk.
     */
    function updateProductStock(uint256 _productId, uint256 _newStock, bool _isAvailable)
        external
        onlyVerifiedStore
    {
        require(products[_productId].storeAddress == msg.sender, "StoreRegistry: not your product");
        products[_productId].stock = _newStock;
        products[_productId].isAvailable = _isAvailable && _newStock > 0;
        emit ProductUpdated(_productId, products[_productId].isAvailable, _newStock);
    }

    // ─── ESCROW-ONLY FUNCTIONS ────────────────────────────────────

    /**
     * @notice Memperbarui skor reputasi toko. Hanya bisa dipanggil oleh DonationEscrow.
     * @param _store Alamat toko
     * @param _rating Rating dari penerima (0 = dispute, 3-5 = sukses)
     * @param _isDispute True jika ini hasil dari dispute yang toko kalahkan
     */
    function updateReputation(address _store, uint8 _rating, bool _isDispute)
        external
        onlyEscrow
    {
        StoreReputation storage rep = reputations[_store];
        rep.totalOrders++;

        int256 change = 0;

        if (_isDispute) {
            rep.totalDisputes++;
            rep.disputesLost++;
            change = -int256(REP_PENALTY_DISPUTE);
            rep.reputationScore = rep.reputationScore > REP_PENALTY_DISPUTE
                ? rep.reputationScore - REP_PENALTY_DISPUTE
                : 0;
        } else if (_rating >= 4) {
            rep.successfulOrders++;
            change = int256(REP_BONUS_HIGH);
            rep.reputationScore += REP_BONUS_HIGH;
        } else if (_rating == 3) {
            rep.successfulOrders++;
            change = int256(REP_BONUS_LOW);
            rep.reputationScore += REP_BONUS_LOW;
        } else {
            rep.totalDisputes++;
            change = -int256(REP_PENALTY_DISPUTE);
            rep.reputationScore = rep.reputationScore > REP_PENALTY_DISPUTE
                ? rep.reputationScore - REP_PENALTY_DISPUTE
                : 0;
        }

        // Auto-suspend jika reputasi di bawah minimum
        if (rep.reputationScore < MIN_REPUTATION) {
            rep.isSuspended = true;
            emit StoreSuspended(_store, "Reputation below minimum threshold");
        }

        emit ReputationUpdated(_store, rep.reputationScore, change);
    }

    function decreaseStock(uint256 _productId) external onlyEscrow {
        require(products[_productId].stock > 0, "StoreRegistry: out of stock");
        products[_productId].stock--;
        if (products[_productId].stock == 0) {
            products[_productId].isAvailable = false;
        }
    }

    // ─── VIEW FUNCTIONS ───────────────────────────────────────────

    function getProduct(uint256 _productId) external view returns (Product memory) {
        return products[_productId];
    }

    function getStoreReputation(address _store) external view returns (StoreReputation memory) {
        return reputations[_store];
    }

    function isProductAvailable(uint256 _productId) external view returns (bool) {
        Product memory p = products[_productId];
        return p.isAvailable && p.stock > 0 && p.expiryDate > block.timestamp;
    }

    function getStoreProducts(address _store) external view returns (uint256[] memory) {
        return storeProducts[_store];
    }

    function totalProducts() external view returns (uint256) {
        return _productIdCounter;
    }
}