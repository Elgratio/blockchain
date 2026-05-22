// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./UserRegistry.sol";
import "./DonationEscrow.sol";

/**
 * @title DisputeResolution
 * @author FoodChain Team
 * @notice Mengelola proses mediasi dan penyelesaian perselisihan antara
 *         penerima donasi dan toko mitra. Setiap bukti tersimpan on-chain
 *         sebagai hash IPFS transparan dan tidak dapat dipalsukan.
 */
contract DisputeResolution is Ownable, ReentrancyGuard {

    UserRegistry  public immutable userRegistry;
    DonationEscrow public immutable escrow;

    // ─── ENUMS ───────────────────────────────────────────────────
    enum DisputeResult { PENDING, STORE_WIN, DONOR_WIN }

    // ─── STRUCTS ─────────────────────────────────────────────────
    struct Dispute {
        uint256 donationId;
        address raisedBy;
        string  evidenceHash;      // IPFS hash bukti dari penerima
        string  storeResponseHash; // IPFS hash respons dari toko
        DisputeResult result;
        address resolvedBy;
        uint256 raisedAt;
        uint256 resolvedAt;
        string  resolutionNotes;   // Catatan alasan keputusan (hash IPFS)
    }

    // ─── STATE VARIABLES ─────────────────────────────────────────
    mapping(uint256 => Dispute) public disputes;       // donationId => Dispute
    mapping(uint256 => bool)    public hasDispute;

    uint256 public constant RESPONSE_DEADLINE = 3 days;  // Batas waktu toko merespons

    // ─── EVENTS ──────────────────────────────────────────────────
    event DisputeRaised(uint256 indexed donationId, address indexed raisedBy, string evidenceHash);
    event StoreResponded(uint256 indexed donationId, string responseHash);
    event DisputeResolved(uint256 indexed donationId, DisputeResult result, address resolvedBy);

    // ─── MODIFIERS ───────────────────────────────────────────────
    modifier disputeExists(uint256 _donationId) {
        require(hasDispute[_donationId], "Dispute: no dispute for this donation");
        _;
    }

    modifier disputePending(uint256 _donationId) {
        require(
            disputes[_donationId].result == DisputeResult.PENDING,
            "Dispute: already resolved"
        );
        _;
    }

    // ─── CONSTRUCTOR ─────────────────────────────────────────────
    constructor(address _userRegistry, address _escrow) Ownable(msg.sender) {
        userRegistry = UserRegistry(_userRegistry);
        escrow       = DonationEscrow(_escrow);
    }

    // ─── EXTERNAL FUNCTIONS ───────────────────────────────────────

    /**
     * @notice Mengajukan komplain terhadap donasi yang bermasalah.
     *         Hanya penerima donasi yang dapat memanggil.
     * @param _donationId   ID donasi yang bermasalah
     * @param _evidenceHash Hash IPFS dari foto/video bukti masalah
     */
    function raiseDispute(uint256 _donationId, string calldata _evidenceHash)
        external
        nonReentrant
    {
        require(!hasDispute[_donationId], "Dispute: dispute already exists");
        require(bytes(_evidenceHash).length > 0, "Dispute: evidence required");

        DonationEscrow.Donation memory d = escrow.getDonation(_donationId);
        require(d.recipient == msg.sender, "Dispute: not the recipient");
        require(
            d.status == DonationEscrow.DonationStatus.DISPUTED,
            "Dispute: donation not in disputed status"
        );

        disputes[_donationId] = Dispute({
            donationId:        _donationId,
            raisedBy:          msg.sender,
            evidenceHash:      _evidenceHash,
            storeResponseHash: "",
            result:            DisputeResult.PENDING,
            resolvedBy:        address(0),
            raisedAt:          block.timestamp,
            resolvedAt:        0,
            resolutionNotes:   ""
        });

        hasDispute[_donationId] = true;

        emit DisputeRaised(_donationId, msg.sender, _evidenceHash);
    }

    /**
     * @notice Toko merespons komplain dengan bukti balasan.
     * @param _donationId    ID donasi yang dikomplain
     * @param _responseHash  Hash IPFS bukti/klarifikasi dari toko
     */
    function storeRespond(uint256 _donationId, string calldata _responseHash)
        external
        nonReentrant
        disputeExists(_donationId)
        disputePending(_donationId)
    {
        DonationEscrow.Donation memory d = escrow.getDonation(_donationId);
        require(d.store == msg.sender, "Dispute: not the store");
        require(bytes(_responseHash).length > 0, "Dispute: response cannot be empty");
        require(
            bytes(disputes[_donationId].storeResponseHash).length == 0,
            "Dispute: already responded"
        );

        disputes[_donationId].storeResponseHash = _responseHash;

        emit StoreResponded(_donationId, _responseHash);
    }

    /**
     * @notice Admin/validator memutuskan hasil dispute.
     * @param _donationId      ID donasi yang berdispute
     * @param _result          Hasil keputusan (STORE_WIN atau DONOR_WIN)
     * @param _resolutionNotes Hash IPFS dari catatan alasan keputusan
     */
    function resolveDispute(
        uint256 _donationId,
        DisputeResult _result,
        string calldata _resolutionNotes
    )
        external
        onlyOwner
        nonReentrant
        disputeExists(_donationId)
        disputePending(_donationId)
    {
        require(_result != DisputeResult.PENDING, "Dispute: must provide a final result");

        Dispute storage disp = disputes[_donationId];
        disp.result          = _result;
        disp.resolvedBy      = msg.sender;
        disp.resolvedAt      = block.timestamp;
        disp.resolutionNotes = _resolutionNotes;

        if (_result == DisputeResult.DONOR_WIN) {
            // Toko bersalah: kembalikan dana ke pendonasi
            escrow.refundDonor(_donationId);
        } else {
            // Komplain tidak valid: cairkan dana ke toko
            escrow.releaseAfterDispute(_donationId);
        }

        emit DisputeResolved(_donationId, _result, msg.sender);
    }

    // ─── VIEW FUNCTIONS ───────────────────────────────────────────

    function getDispute(uint256 _donationId) external view returns (Dispute memory) {
        require(hasDispute[_donationId], "Dispute: not found");
        return disputes[_donationId];
    }

    function isDisputePending(uint256 _donationId) external view returns (bool) {
        return hasDispute[_donationId] && disputes[_donationId].result == DisputeResult.PENDING;
    }
}