// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FairPass
 * @notice Anti-scalp event ticketing with Fair Resale Queue on BNB Smart Chain.
 *
 *  Core rules enforced in bytecode:
 *    1. Tickets are bought at a fixed FACE_VALUE.
 *    2. NO peer-to-peer transfers. A holder can only return the ticket
 *       to the on-chain FairVault.
 *    3. The vault refunds the seller at most 105% of face value.
 *    4. The AI agent (or organizer) awards the returned ticket to the
 *       next verified fan on the waitlist — scalpers cannot choose buyers.
 *    5. Tickets flagged for off-platform scalping are slashed permanently.
 */
contract FairPass {
    // ── Roles ──────────────────────────────────────────────
    address public organizer;
    address public aiAgent;

    // ── Pricing ────────────────────────────────────────────
    uint256 public constant FACE_VALUE   = 0.002 ether;   // ~₱200
    uint256 public constant MAX_RESALE   = 0.0021 ether;  // 105 % cap
    uint256 public constant BOUNTY       = 0.0005 ether;

    // ── Counters ───────────────────────────────────────────
    uint256 public nextTicketId = 1;
    uint256 public maxTickets;

    // ── Data ───────────────────────────────────────────────
    enum Status { AVAILABLE, OWNED, IN_VAULT, REDEEMED, SLASHED }

    struct Ticket {
        address owner;
        Status  status;
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(address => bool)   public verifiedFans;

    // Waitlist (simple FIFO queue)
    address[] public waitlist;
    uint256   public waitlistHead;

    // ── Events ─────────────────────────────────────────────
    event TicketPurchased(uint256 indexed id, address indexed buyer);
    event TicketReturnedToVault(uint256 indexed id, address indexed seller, uint256 refund);
    event TicketAwardedFromQueue(uint256 indexed id, address indexed newOwner);
    event TicketRedeemed(uint256 indexed id);
    event TicketSlashed(uint256 indexed id, string reason, address indexed whistleblower);
    event FanVerified(address indexed fan);
    event FanJoinedWaitlist(address indexed fan);

    // ── Modifiers ──────────────────────────────────────────
    modifier onlyAgentOrOrganizer() {
        require(msg.sender == aiAgent || msg.sender == organizer, "Unauthorized");
        _;
    }

    // ── Constructor ────────────────────────────────────────
    constructor(address _aiAgent, uint256 _maxTickets) {
        organizer  = msg.sender;
        aiAgent    = _aiAgent;
        maxTickets = _maxTickets;
    }

    // ── 0. Fan Verification (AI or Organizer) ──────────────
    function verifyFan(address fan) external onlyAgentOrOrganizer {
        verifiedFans[fan] = true;
        emit FanVerified(fan);
    }

    // ── 1. Primary Purchase ────────────────────────────────
    function buyTicket() external payable returns (uint256) {
        require(verifiedFans[msg.sender], "FairPass: fan not verified");
        require(msg.value == FACE_VALUE, "FairPass: exact face value required");
        require(nextTicketId <= maxTickets, "FairPass: sold out");

        uint256 id = nextTicketId++;
        tickets[id] = Ticket(msg.sender, Status.OWNED);
        emit TicketPurchased(id, msg.sender);
        return id;
    }

    // ── 2. Return to Vault (NO peer-to-peer) ──────────────
    //  Seller gets refunded up to 105 % of face value from the vault.
    function returnToVault(uint256 id) external {
        Ticket storage t = tickets[id];
        require(msg.sender == t.owner, "FairPass: not your ticket");
        require(t.status == Status.OWNED, "FairPass: ticket not in OWNED state");

        t.status = Status.IN_VAULT;
        t.owner  = address(this);

        // Refund seller (capped at MAX_RESALE)
        uint256 refund = address(this).balance >= MAX_RESALE ? MAX_RESALE : FACE_VALUE;
        (bool ok, ) = payable(msg.sender).call{value: refund}("");
        require(ok, "FairPass: refund failed");

        emit TicketReturnedToVault(id, msg.sender, refund);
    }

    // ── 3. Join Waitlist ───────────────────────────────────
    function joinWaitlist() external payable {
        require(verifiedFans[msg.sender], "FairPass: fan not verified");
        require(msg.value == FACE_VALUE, "FairPass: deposit face value to join");
        waitlist.push(msg.sender);
        emit FanJoinedWaitlist(msg.sender);
    }

    // ── 4. Award from Queue (AI Agent) ─────────────────────
    function awardFromQueue(uint256 id) external onlyAgentOrOrganizer {
        Ticket storage t = tickets[id];
        require(t.status == Status.IN_VAULT, "FairPass: ticket not in vault");
        require(waitlistHead < waitlist.length, "FairPass: waitlist empty");

        address nextFan = waitlist[waitlistHead];
        waitlistHead++;

        t.owner  = nextFan;
        t.status = Status.OWNED;

        emit TicketAwardedFromQueue(id, nextFan);
    }

    // ── 5. Gate Check-in ───────────────────────────────────
    function redeemAtGate(uint256 id) external onlyAgentOrOrganizer {
        Ticket storage t = tickets[id];
        require(t.status == Status.OWNED, "FairPass: cannot redeem");
        t.status = Status.REDEEMED;
        emit TicketRedeemed(id);
    }

    // ── 6. Slash (AI Scalper Bouncer) ──────────────────────
    function slashTicket(uint256 id, address whistleblower, string calldata reason)
        external
        onlyAgentOrOrganizer
    {
        Ticket storage t = tickets[id];
        require(t.status != Status.SLASHED, "FairPass: already slashed");
        t.status = Status.SLASHED;

        if (address(this).balance >= BOUNTY && whistleblower != address(0)) {
            (bool ok, ) = payable(whistleblower).call{value: BOUNTY}("");
            require(ok, "FairPass: bounty failed");
        }
        emit TicketSlashed(id, reason, whistleblower);
    }

    // ── Views ──────────────────────────────────────────────
    function getTicket(uint256 id) external view returns (address, Status) {
        Ticket memory t = tickets[id];
        return (t.owner, t.status);
    }

    function getWaitlistLength() external view returns (uint256) {
        return waitlist.length - waitlistHead;
    }

    receive() external payable {}
}
