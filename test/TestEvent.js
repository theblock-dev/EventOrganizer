const { expectRevert, time } = require('@openzeppelin/test-helpers');
const EventContract = artifacts.require('EventOrg.sol');

contract('EventOrg', (accounts) => {
  let eventContract = null;
  
  before(async () => {
    eventContract = await EventContract.new();
  });

  it('Should NOT create an event if date is in past', async () => {
    const date = (await time.latest()).sub(time.duration.seconds(1));  //future date
    await expectRevert(
      eventContract.createEvent('event1', 5, date, 10),
      'no past date event is allowed'
    );
  });

  it('Should NOT create an event if less than 1 ticket', async () => {
    const date = (await time.latest()).add(time.duration.seconds(1000));  
    await expectRevert(
      eventContract.createEvent('event1',5, date, 0),
      'atleast 1 ticket is required'
    );
  });

  it('Should create an event', async () => {
    const date = (await time.latest()).add(time.duration.seconds(1000));  
    await eventContract.createEvent('event1', 5, date, 2);
    const event = await eventContract.events(0);
    assert(event.id.toNumber() === 0); 
    assert(event.name === 'event1');
    assert(event.date.toNumber() === date.toNumber()); 
  });

  it('Should NOT buy a ticket if event does not exist', async () => {
    await expectRevert(
      eventContract.buyTickets(1, 1),
      'this event does not exist'
    );
  });

  context('event created', () => {
    beforeEach(async () => {
      const date = (await time.latest()).add(time.duration.seconds(1000));  
      await eventContract.createEvent('event1',5, date,2);
    });

    it('Should NOT buy a ticket if wrong amount of ether sent', async () => {
      await expectRevert(
        eventContract.buyTickets(0, 1,{value:2}),
        'not enough ether sent'
      );
    });

    it('Should NOT buy a ticket if not enough ticket left', async () => {
      await expectRevert(
        eventContract.buyTickets(0, 3, {value: 15}),
        'not enough tickets available'
      );
    });

    it('Should buy tickets', async () => {
      await eventContract.buyTickets(0, 1, {value: 5, from: accounts[1]});
      await eventContract.buyTickets(0, 1, {value: 5, from: accounts[2]});
      const ticketCount1 = await eventContract.tickets.call(accounts[1], 0);
      const ticketCount2 = await eventContract.tickets.call(accounts[2], 0);
      assert(ticketCount1.toNumber() === 1);
      assert(ticketCount2.toNumber() === 1);
    });

    it('Should NOT transfer ticket it not enough tickets', async () => {
      await expectRevert(
        eventContract.transferTicket(0, 3, accounts[5]),
        'not enough tickets to transfer'
      );
    });

    it('Should transfer ticket', async () => {
      await eventContract.transferTicket(0, 1, accounts[5], {from: accounts[1]});
      const ticketCount1 = await eventContract.tickets.call(accounts[1], 0);
      const ticketCount5 = await eventContract.tickets.call(accounts[5], 0);
      assert(ticketCount1.toNumber() === 0);
      assert(ticketCount5.toNumber() === 1);
    });

    it('Should NOT buy a ticket if event has expired', async () => {
      time.increase(1001);
      await expectRevert(
        eventContract.buyTickets(0, 1),
        'this event is not active anymore'
      );
    });
  });
});