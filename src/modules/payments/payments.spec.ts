import request from "supertest";
import app from "../../app";
import { loginAsCustomer, loginAsDriver, loginAsStaff } from "../../test/helpers/auth.helper";
import { createTestShipment, markPaymentPaid } from "../../test/helpers/test-data.helper";

describe("PAYMENTS", () => {
  it("Staff/admin can mark payment paid", async () => {
    const { token: staffToken } = await loginAsStaff();
    const created = await createTestShipment(staffToken);
    const shipmentId = created.body.data.id as string;

    const res = await markPaymentPaid(staffToken, shipmentId);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PAID");
  });

  it("Customer can view own shipment payment", async () => {
    const { token: customerToken } = await loginAsCustomer();
    const created = await createTestShipment(customerToken);
    const shipmentId = created.body.data.id as string;

    const res = await request(app).get(`/payments/${shipmentId}`).set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
  });

  it("Unauthorized user cannot mark payment paid", async () => {
    const { token: staffToken } = await loginAsStaff();
    const created = await createTestShipment(staffToken);
    const shipmentId = created.body.data.id as string;

    const { token: driverToken } = await loginAsDriver();
    const res = await request(app)
      .patch(`/payments/${shipmentId}/mark-paid`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ providerReference: "x" });
    expect(res.status).toBe(403);
  });
});

