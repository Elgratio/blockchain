// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UserRegistry
 * @author FoodChain Team
 * @notice Registri identitas terpusat untuk semua aktor dalam sistem FoodChain.
 *         Data pribadi TIDAK disimpan on-chain, hanya hash IPFS sebagai pointer.
 */
contract UserRegistry is Ownable, ReentrancyGuard {

    // ─── ENUMS ───────────────────────────────────────────────────
    enum Role { DONOR, STORE, RECIPIENT, COURIER, ADMIN }

    // ─── STRUCTS ─────────────────────────────────────────────────
    struct User {
        address walletAddress;
        Role role;
        string dataHash;       // Hash IPFS dari data pribadi terenkripsi
        bool isVerified;
        uint256 registeredAt;
        bool isActive;
    }

    // ─── STATE VARIABLES ─────────────────────────────────────────
    mapping(address => User) private users;
    mapping(address => bool) private registeredAddresses;

    // ─── EVENTS ──────────────────────────────────────────────────
    event UserRegistered(address indexed user, Role role, uint256 timestamp);
    event UserVerified(address indexed user, address indexed verifiedBy);
    event UserSuspended(address indexed user, address indexed suspendedBy);
    event UserReactivated(address indexed user, address indexed reactivatedBy);
    event DataHashUpdated(address indexed user, string newHash);

    // ─── MODIFIERS ───────────────────────────────────────────────
    modifier onlyRegistered(address _addr) {
        require(registeredAddresses[_addr], "UserRegistry: address not registered");
        _;
    }

    modifier onlyVerifiedUser(address _addr) {
        require(users[_addr].isVerified, "UserRegistry: user not verified");
        require(users[_addr].isActive, "UserRegistry: user is suspended");
        _;
    }

    // ─── CONSTRUCTOR ─────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ─── EXTERNAL FUNCTIONS ───────────────────────────────────────

    /**
     * @notice Mendaftarkan pengguna baru ke sistem.
     * @param _role Peran pengguna (DONOR, STORE, RECIPIENT, COURIER)
     * @param _dataHash Hash IPFS dari data pribadi yang telah terenkripsi
     */
    function registerUser(Role _role, string calldata _dataHash) external nonReentrant {
        require(!registeredAddresses[msg.sender], "UserRegistry: already registered");
        require(_role != Role.ADMIN, "UserRegistry: cannot self-register as admin");
        require(bytes(_dataHash).length > 0, "UserRegistry: dataHash cannot be empty");

        users[msg.sender] = User({
            walletAddress: msg.sender,
            role: _role,
            dataHash: _dataHash,
            isVerified: false,
            registeredAt: block.timestamp,
            isActive: true
        });

        registeredAddresses[msg.sender] = true;

        emit UserRegistered(msg.sender, _role, block.timestamp);
    }

    /**
     * @notice Memverifikasi akun pengguna. Hanya owner (admin) yang dapat memanggil.
     * @param _user Alamat wallet pengguna yang akan diverifikasi
     */
    function verifyUser(address _user)
        external
        onlyOwner
        onlyRegistered(_user)
    {
        require(!users[_user].isVerified, "UserRegistry: already verified");
        users[_user].isVerified = true;
        emit UserVerified(_user, msg.sender);
    }

    /**
     * @notice Menangguhkan akun pengguna yang bermasalah.
     * @param _user Alamat wallet pengguna yang akan di-suspend
     */
    function suspendUser(address _user)
        external
        onlyOwner
        onlyRegistered(_user)
    {
        require(users[_user].isActive, "UserRegistry: user already suspended");
        users[_user].isActive = false;
        emit UserSuspended(_user, msg.sender);
    }

    /**
     * @notice Mengaktifkan kembali akun yang telah di-suspend.
     */
    function reactivateUser(address _user)
        external
        onlyOwner
        onlyRegistered(_user)
    {
        require(!users[_user].isActive, "UserRegistry: user is already active");
        users[_user].isActive = true;
        emit UserReactivated(_user, msg.sender);
    }

    /**
     * @notice Memperbarui hash data pengguna (misalnya jika alamat berubah).
     */
    function updateDataHash(string calldata _newHash) external onlyRegistered(msg.sender) {
        require(bytes(_newHash).length > 0, "UserRegistry: hash cannot be empty");
        users[msg.sender].dataHash = _newHash;
        emit DataHashUpdated(msg.sender, _newHash);
    }

    // ─── VIEW FUNCTIONS ───────────────────────────────────────────

    function isVerified(address _user) external view returns (bool) {
        return users[_user].isVerified && users[_user].isActive;
    }

    function getRole(address _user) external view returns (Role) {
        require(registeredAddresses[_user], "UserRegistry: not registered");
        return users[_user].role;
    }

    function isRegistered(address _user) external view returns (bool) {
        return registeredAddresses[_user];
    }

    function getUser(address _user) external view returns (User memory) {
        require(registeredAddresses[_user], "UserRegistry: not registered");
        return users[_user];
    }
}