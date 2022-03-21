// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EventOrg {
  
  struct Event {
    uint id;    
    string name;
    address admin;
    uint price;
    uint date;
    uint ticketCount;
    uint ticketRemaining;
  }

  uint public nextEventId;

  mapping(uint => Event) public events;
  mapping(address => mapping(uint=>uint)) public tickets;

  function createEvent(string memory _name, uint _price, uint _date, uint _ticketCount) external {
    require(_date > block.timestamp, 'no past date event is allowed');
    require(_ticketCount > 0, 'atleast 1 ticket is required');

    events[nextEventId] = Event(nextEventId, _name,msg.sender,_price,_date,_ticketCount,_ticketCount);
    nextEventId++;
  }

  function buyTickets(uint _eventId, uint _quantity) external payable {
    Event storage eventInstance = events[_eventId];

    require(eventInstance.date != 0, 'this event does not exist');
    require(eventInstance.date > block.timestamp, 'this event is not active anymore');
    require(_quantity <= eventInstance.ticketRemaining, 'not enough tickets available');
    require(msg.value == (eventInstance.price * _quantity), 'not enough ether sent');

    eventInstance.ticketRemaining -= _quantity;
    tickets[msg.sender][_eventId] += _quantity;
  }

  function transferTicket(uint _eventId, uint _quantity, address _to) external {
    require(events[_eventId].date != 0, 'event does not exist');
    require(events[_eventId].date > block.timestamp, 'event is not active anymore');
    require(tickets[msg.sender][_eventId] >= _quantity, 'not enough tickets to transfer');

    tickets[msg.sender][_eventId] -= _quantity;
    tickets[_to][_eventId] += _quantity;    
  }

}
