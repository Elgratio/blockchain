// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./UserRegistry.sol";
import "./StoreRegistry.sol";

/**
 * @title DonationEscrow
 * @author FoodChain Team
 * @notice Jantung sistem FoodChain. Mengelola seluruh siklus hidup donasi:
 *         penciptaan, konfirmasi bertingkat, pencairan, dan refund.
 *         Dana TIDAK DAPAT diakses oleh pihak manapun di luar logika kontrak ini.
 */
contract DonationEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    UserRegistry  public immutable userRegistry;
    StoreRegistry public immutable storeRegistry;
    IERC20        public immutable stablecoin;   // USDC atau IDRX

    // ─── ENUMS ───────────────────────────────────────────────────
    enum DonationStatus {
        CREATED,
        STORE_CONFIRMED,
        IN_DELIVERY,
        DELIVERED,
        COMPLETED,
        DISPUTED,
        REFUNDED
    }

    // ─── STRUCTS ─────────────────────────────────────────────────
    struct Donation {
        uint256 donationId;
        address donor;
        address store;
        address recipient;
        address courier;
        uint256[] productIds;
        uint256 totalAmount;
        DonationStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        // Hash bukti foto di setiap tahap (IPFS)
        string packingPhotoHash;
        string pickupPhotoHash;
        string receivedPhotoHash;
        uint8 recipientRating;    // 1-5
    }

    // ─── STATE VARIABLES ─────────────────────────────────────────
    uint256 private _donationIdCounter;
    mapping(uint256 => Donation) public donations;
    mapping(address => uint256[]) public donorDonations;
    mapping(address => uint256[]) public recipientDonations;

    address public disputeContract;
    uint256 public platformFeePercent = 100; // 1% (basis 10000)

    // ─── EVENTS ──────────────────────────────────────────────────
    event DonationCreated(
        uint256 indexed donationId,
        address indexed donor,
        address indexed recipient,
        address store,
        uint256 amount
    );
    event StoreConfirmed(uint256 indexed donationId, string packingPhotoHash);
    event CourierPickedUp(uint256 indexed donationId, string pickupPhotoHash);
    event RecipientConfirmed(uint256 indexed donationId, uint8 rating, string receivedPhotoHash);
    event DonationCompleted(uint256 indexed donationId, address store, uint256 amount);
    event DonationDisputed(uint256 indexed donationId, address raisedBy);
    event DonationRefunded(uint256 indexed donationId, address donor, uint256 amount);
    event DisputeContractSet(address indexed disputeContract);

    // ─── MODIFIERS ───────────────────────────────────────────────
    modifier onlyDonor(uint256 _id) {
        require(donations[_id].donor == msg.sender, "Escrow: not the donor");
        _;
    }

    modifier onlyStore(uint256 _id) {
        require(donations[_id].store == msg.sender, "Escrow: not the store");
        _;
    }

    modifier onlyCourier(uint256 _id) {
        require(donations[_id].courier == msg.sender, "Escrow: not the courier");
        _;
    }

    modifier onlyRecipient(uint256 _id) {
        require(donations[_id].recipient == msg.sender, "Escrow: not the recipient");
        _;
    }

    modifier onlyDispute() {
        require(msg.sender == disputeContract, "Escrow: caller is not dispute contract");
        _;
    }

    modifier inStatus(uint256 _id, DonationStatus _expected) {
        require(donations[_id].status == _expected, "Escrow: invalid status for this action");
        _;
    }

    // ─── CONSTRUCTOR ─────────────────────────────────────────────
    constructor(
        address _userRegistry,
        address _storeRegistry,
        address _stablecoin
    ) Ownable(msg.sender) {
        userRegistry  = UserRegistry(_userRegistry);
        storeRegistry = StoreRegistry(_storeRegistry);
        stablecoin    = IERC20(_stablecoin);
    }

    // ─── ADMIN FUNCTIONS ─────────────────────────────────────────

    function setDisputeContract(address _dispute) external onlyOwner {
        require(_dispute != address(0), "Escrow: zero address");
        disputeContract = _dispute;
        emit DisputeContractSet(_dispute);
    }

    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 500, "Escrow: fee cannot exceed 5%");
        platformFeePercent = _feePercent;
    }

    // ─── CORE DONATION FLOW ───────────────────────────────────────

    /**
     * @notice Langkah 1: Pendonasi membuat donasi dan mengunci dana ke escrow.
     * @param _store     Alamat toko mitra
     * @param _recipient Alamat penerima donasi
     * @param _courier   Alamat kurir
     * @param _productIds Array ID produk yang didonasikan
     * @param _amount    Total jumlah stablecoin yang dibayarkan
     */
    function createDonation(
        address _store,
        address _recipient,
        address _courier,
        uint256[] calldata _productIds,
        uint256 _amount
    ) external nonReentrant returns (uint256) {
        // Verifikasi semua pihak
        require(userRegistry.isVerified(msg.sender), "Escrow: donor not verified");
        require(userRegistry.isVerified(_store), "Escrow: store not verified");
        require(userRegistry.isVerified(_recipient), "Escrow: recipient not verified");
        require(userRegistry.isVerified(_courier), "Escrow: courier not verified");
        require(_productIds.length > 0, "Escrow: no products");
        require(_amount > 0, "Escrow: amount must be > 0");

        // Verifikasi produk tersedia
        for (uint256 i = 0; i < _productIds.length; i++) {
            require(
                storeRegistry.isProductAvailable(_productIds[i]),
                "Escrow: product not available"
            );
        }

        // Transfer stablecoin dari donor ke kontrak (escrow)
        stablecoin.safeTransferFrom(msg.sender, address(this), _amount);

        _donationIdCounter++;
        uint256 newId = _donationIdCounter;

        donations[newId] = Donation({
            donationId:       newId,
            donor:            msg.sender,
            store:            _store,
            recipient:        _recipient,
            courier:          _courier,
            productIds:       _productIds,
            totalAmount:      _amount,
            status:           DonationStatus.CREATED,
            createdAt:        block.timestamp,
            updatedAt:        block.timestamp,
            packingPhotoHash: "",
            pickupPhotoHash:  "",
            receivedPhotoHash:"",
            recipientRating:  0
        });

        donorDonations[msg.sender].push(newId);
        recipientDonations[_recipient].push(newId);

        // Kurangi stok produk
        for (uint256 i = 0; i < _productIds.length; i++) {
            storeRegistry.decreaseStock(_productIds[i]);
        }

        emit DonationCreated(newId, msg.sender, _recipient, _store, _amount);
        return newId;
    }

    /**
     * @notice Langkah 2: Toko mengkonfirmasi pesanan dan mengupload foto packing.
     * @param _donationId     ID donasi
     * @param _packingPhotoHash Hash IPFS foto packing barang
     */
    function storeConfirm(uint256 _donationId, string calldata _packingPhotoHash)
        external
        nonReentrant
        onlyStore(_donationId)
        inStatus(_donationId, DonationStatus.CREATED)
    {
        require(bytes(_packingPhotoHash).length > 0, "Escrow: packing photo required");

        donations[_donationId].packingPhotoHash = _packingPhotoHash;
        donations[_donationId].status = DonationStatus.STORE_CONFIRMED;
        donations[_donationId].updatedAt = block.timestamp;

        emit StoreConfirmed(_donationId, _packingPhotoHash);
    }

    /**
     * @notice Langkah 3: Kurir mengkonfirmasi pengambilan barang.
     * @param _donationId    ID donasi
     * @param _pickupPhotoHash Hash IPFS foto saat kurir menerima barang
     */
    function courierPickup(uint256 _donationId, string calldata _pickupPhotoHash)
        external
        nonReentrant
        onlyCourier(_donationId)
        inStatus(_donationId, DonationStatus.STORE_CONFIRMED)
    {
        require(bytes(_pickupPhotoHash).length > 0, "Escrow: pickup photo required");

        donations[_donationId].pickupPhotoHash = _pickupPhotoHash;
        donations[_donationId].status = DonationStatus.IN_DELIVERY;
        donations[_donationId].updatedAt = block.timestamp;

        emit CourierPickedUp(_donationId, _pickupPhotoHash);
    }

    /**
     * @notice Langkah 4: Penerima mengkonfirmasi penerimaan barang dan memberikan rating.
     * @param _donationId      ID donasi
     * @param _receivedPhotoHash Hash IPFS foto barang yang diterima
     * @param _rating          Rating kualitas barang (1-5)
     */
    function recipientConfirm(
        uint256 _donationId,
        string calldata _receivedPhotoHash,
        uint8 _rating
    )
        external
        nonReentrant
        onlyRecipient(_donationId)
        inStatus(_donationId, DonationStatus.IN_DELIVERY)
    {
        require(_rating >= 1 && _rating <= 5, "Escrow: rating must be 1-5");
        require(bytes(_receivedPhotoHash).length > 0, "Escrow: photo required");

        Donation storage d = donations[_donationId];
        d.receivedPhotoHash = _receivedPhotoHash;
        d.recipientRating   = _rating;
        d.status            = DonationStatus.DELIVERED;
        d.updatedAt         = block.timestamp;

        emit RecipientConfirmed(_donationId, _rating, _receivedPhotoHash);

        if (_rating >= 3) {
            // Barang diterima dengan baik → cairkan dana ke toko
            _releaseFunds(_donationId);
        } else {
            // Kualitas bermasalah → masuk dispute
            d.status = DonationStatus.DISPUTED;
            emit DonationDisputed(_donationId, msg.sender);
        }
    }

    // ─── INTERNAL FUNCTIONS ───────────────────────────────────────

    /**
     * @dev Mencairkan dana ke toko mitra setelah donasi berhasil.
     *      Platform fee dipotong dan disimpan di kontrak.
     */
    function _releaseFunds(uint256 _donationId) internal {
        Donation storage d = donations[_donationId];

        uint256 fee    = (d.totalAmount * platformFeePercent) / 10000;
        uint256 payout = d.totalAmount - fee;

        d.status    = DonationStatus.COMPLETED;
        d.updatedAt = block.timestamp;

        // Update reputasi toko
        storeRegistry.updateReputation(d.store, d.recipientRating, false);

        // Transfer ke toko (Checks-Effects-Interactions pattern)
        stablecoin.safeTransfer(d.store, payout);

        emit DonationCompleted(_donationId, d.store, payout);
    }

    // ─── DISPUTE CONTRACT FUNCTIONS ───────────────────────────────

    /**
     * @notice Dipanggil oleh DisputeResolution: kembalikan dana ke pendonasi.
     */
    function refundDonor(uint256 _donationId) external nonReentrant onlyDispute {
        Donation storage d = donations[_donationId];
        require(d.status == DonationStatus.DISPUTED, "Escrow: not in disputed status");

        d.status    = DonationStatus.REFUNDED;
        d.updatedAt = block.timestamp;

        storeRegistry.updateReputation(d.store, 0, true);
        stablecoin.safeTransfer(d.donor, d.totalAmount);

        emit DonationRefunded(_donationId, d.donor, d.totalAmount);
    }

    /**
     * @notice Dipanggil oleh DisputeResolution: cairkan dana ke toko (toko menang dispute).
     */
    function releaseAfterDispute(uint256 _donationId) external nonReentrant onlyDispute {
        Donation storage d = donations[_donationId];
        require(d.status == DonationStatus.DISPUTED, "Escrow: not in disputed status");

        d.recipientRating = 3; // Rating default saat dispute selesai dengan toko menang
        _releaseFunds(_donationId);
    }

    // ─── VIEW FUNCTIONS ───────────────────────────────────────────

    function getDonation(uint256 _donationId) external view returns (Donation memory) {
        return donations[_donationId];
    }

    function getDonorDonations(address _donor) external view returns (uint256[] memory) {
        return donorDonations[_donor];
    }

    function getRecipientDonations(address _recipient) external view returns (uint256[] memory) {
        return recipientDonations[_recipient];
    }

    function totalDonations() external view returns (uint256) {
        return _donationIdCounter;
    }

    function getEscrowBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }

    // ─── ADMIN WITHDRAW FEE ──────────────────────────────────────

    /**
     * @notice Menarik platform fee yang terkumpul. Hanya owner.
     */
    function withdrawFees(address _to) external onlyOwner nonReentrant {
        require(_to != address(0), "Escrow: zero address");
        uint256 balance = stablecoin.balanceOf(address(this));
        require(balance > 0, "Escrow: no fees to withdraw");
        stablecoin.safeTransfer(_to, balance);
    }
}