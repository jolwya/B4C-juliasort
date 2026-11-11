// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FairTicket
 * @dev Anti-scalp event ticketing with on-chain price ceilings and AI-driven scalper slashing.
 * Built for BCC Hackathon 2026 on BNB Smart Chain Testnet.
 */
contract FairTicket {
    address public organizer;
    address public aiAgent;
    uint256 public constant FACE_VALUE = 0.002 ether; // 0.002 tBNB fixed face value
    uint256 public nextTicketId = 1;

    struct Ticket {
        address owner;
        bool isUsed;
        bool isSlashed; // Flagged & invalidated for scalping
    }

    mapping(uint256 => Ticket) public tickets;

    event TicketMinted(uint256 indexed ticketId, address indexed buyer, uint256 price);
    event TicketResold(uint256 indexed ticketId, address indexed oldOwner, address indexed newOwner, uint256 price);
    event TicketSlashed(uint256 indexed ticketId, string reason, address indexed whistleblower);
    event TicketRedeemed(uint256 indexed ticketId);

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only organizer can call this");
        _;
    }

    modifier onlyAgentOrOrganizer() {
        require(msg.sender == aiAgent || msg.sender == organizer, "Unauthorized: AI Agent or Organizer only");
        _;
    }

    constructor(address _aiAgent) {
        organizer = msg.sender;
        aiAgent = _aiAgent;
    }

    function setAiAgent(address _newAgent) external onlyOrganizer {
        aiAgent = _newAgent;
    }

    // 1. Primary Purchase: Student buys ticket at exact face value
    function buyTicket() external payable returns (uint256) {
        require(msg.value == FACE_VALUE, "Exact face value required (0.002 tBNB)");

        uint256 ticketId = nextTicketId++;
        tickets[ticketId] = Ticket({
            owner: msg.sender,
            isUsed: false,
            isSlashed: false
        });

        emit TicketMinted(ticketId, msg.sender, msg.value);
        return ticketId;
    }

    // 2. Anti-Scalp Ceiling: Resale on-chain CANNOT exceed face value
    function resaleTicket(uint256 ticketId, address newOwner) external payable {
        Ticket storage t = tickets[ticketId];
        require(msg.sender == t.owner, "Not ticket owner");
        require(!t.isUsed, "Ticket already redeemed");
        require(!t.isSlashed, "Ticket has been slashed for fraud");
        
        // --- HARDCODED SMART CONTRACT LAW ---
        require(msg.value <= FACE_VALUE, "ANTI-SCALP VIOLATION: Resale price exceeds face value cap!");

        address previousOwner = t.owner;
        t.owner = newOwner;

        // Refund previous owner
        (bool success, ) = payable(previousOwner).call{value: msg.value}("");
        require(success, "Payment refund failed");

        emit TicketResold(ticketId, previousOwner, newOwner, msg.value);
    }

    // 3. AI Agent Action: Slashes tickets caught scalping off-platform
    function slashScalpedTicket(uint256 ticketId, address whistleblower, string calldata reason) 
        external 
        onlyAgentOrOrganizer 
    {
        Ticket storage t = tickets[ticketId];
        require(t.owner != address(0), "Ticket does not exist");
        require(!t.isSlashed, "Ticket already slashed");

        t.isSlashed = true;

        // Reward whistleblower student with a 0.0005 tBNB bounty if vault has funds
        if (address(this).balance >= 0.0005 ether && whistleblower != address(0)) {
            (bool bountySent, ) = payable(whistleblower).call{value: 0.0005 ether}("");
            require(bountySent, "Bounty transfer failed");
        }

        emit TicketSlashed(ticketId, reason, whistleblower);
    }

    // 4. Gate Check-in: Single-use admission
    function redeemAtGate(uint256 ticketId) external onlyAgentOrOrganizer {
        Ticket storage t = tickets[ticketId];
        require(t.owner != address(0), "Ticket does not exist");
        require(!t.isSlashed, "ACCESS DENIED: Ticket was slashed for scalping!");
        require(!t.isUsed, "ACCESS DENIED: Ticket already redeemed!");

        t.isUsed = true;
        emit TicketRedeemed(ticketId);
    }

    function getTicket(uint256 ticketId) external view returns (address owner, bool isUsed, bool isSlashed) {
        Ticket memory t = tickets[ticketId];
        return (t.owner, t.isUsed, t.isSlashed);
    }

    receive() external payable {}
}
