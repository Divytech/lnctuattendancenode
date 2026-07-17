const fs = require('fs');

let content = fs.readFileSync('D:/clg/lnctuattendance/node/src/app/dashboard/registration/page.tsx', 'utf8');

const replacement = `          <div className="print-only" id="divPrint" style={{ border: '1px solid', padding: '10px', fontFamily: 'Times New Roman', color: 'black', background: 'white' }}>
            <div className="row">
                <div className="col-md-12 text-center">
                    <div className="text-right">
                        <b>(Branch Incharge Copy)</b>
                    </div>
                    <h4>
                        <b>REGISTRATION FORM</b>
                    </h4>
                    <h5 style={{ fontWeight: 'bold' }}>
                        ACADEMIC SESSION- (<label id="lblsession">{data.session}</label>)
                    </h5>
                </div>
            </div>
            
            <div className="row">
                <div className="col-md-12">
                    <table border={1} style={{ margin: '0 auto', width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                        <tr>
                            <td colSpan={7}>
                            </td>
                            <td rowSpan={3} style={{ width: '150px' }}>
                                {data.image1_src ? (
                                    <img id="Image1" alt="Image Not Found" className="img-fluid" src={data.image1_src} style={{ borderWidth: '0px', width: '120px', height: '120px', marginLeft: '13px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '120px', height: '120px', marginLeft: '13px', border: '1px solid #ccc' }}></div>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                College :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblCollegeName">{data.college_name}</label>
                                </b>
                            </td>
                            <td className="style2" style={{ width: '1050px' }}>
                                Batch Name :
                            </td>
                            <td colSpan={4}>
                                <b>
                                    <label id="lblBatch">{data.batch}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Course :
                            </td>
                            <td colSpan={2}>
                                <b>
                                    <label id="lblCourse">{data.course}</label>
                                </b>
                            </td>
                            <td className="style3" style={{ width: '1086px' }}>
                                Class Name :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblClassName">{data.class_name}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Class Roll No. :
                            </td>
                            <td>
                                <b>
                                    <label id="lblClassRollNo">{data.class_roll_no}</label>
                                </b>
                            </td>
                            <td className="style5" style={{ width: '556px' }}>
                                Section :
                            </td>
                            <td className="style3" style={{ width: '1086px' }}>
                                <b>
                                    <label id="lblSection">{data.section}</label>
                                </b>
                            </td>
                            <td>
                                Year :
                            </td>
                            <td>
                                <b>
                                    <label id="Lblyear">{data.year}</label>
                                </b>
                            </td>
                            <td colSpan={2}>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DOB: <b>
                                    <label id="lbldateofbirth">{data.dob}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Enrollment No.:
                            </td>
                            <td>
                                <b>
                                    <label id="lblboardrollno">{data.board_roll_no || data.enr_no}</label>
                                </b>
                            </td>
                            <td className="style5" style={{ width: '556px' }}>
                                Scholar No :
                            </td>
                            <td className="style3" style={{ width: '1086px' }}>
                                <b>
                                    <label id="lblscholar">{data.scholar_no || data.sch_no}</label>
                                </b>
                            </td>
                            <td>
                                Category:
                            </td>
                            <td>
                                <b>
                                    <label id="lblCategory">{data.category}</label>
                                </b>
                            </td>
                            <td>
                                StudentID :
                            </td>
                            <td>
                                <b>
                                    <label id="lblStudentID">{data.student_id || data.accsoft_id}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Student Name :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblstuname">{data.student_name}</label>
                                </b>
                            </td>
                            <td className="style2" style={{ width: '1050px' }}>
                                Student Mobile No. :
                            </td>
                            <td>
                                <b>
                                    <label id="lblSmob">{data.student_mobile}</label>
                                </b>
                            </td>
                            <td className="style2" style={{ width: '1050px' }}>
                                If Change :
                            </td>
                            <td colSpan={2}>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Father's Name Shri :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblFatherName">{data.father_name || data.f_name_2}</label>
                                </b>
                            </td>
                            <td className="style2" style={{ width: '1050px' }}>
                                Mother's Name Smt :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblMotherName">{data.mother_name}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Father's Mobile No. :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblFmob">{data.father_mobile}</label>
                                </b>
                            </td>
                            <td className="style2" style={{ width: '1050px' }}>
                                If Change :
                            </td>
                            <td colSpan={3}>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Mother's Mobile No. :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblMmob">{data.mother_mobile}</label>
                                </b>
                            </td>
                            <td className="style2" style={{ width: '1050px' }}>
                                If Change :
                            </td>
                            <td colSpan={3}>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Permanent Address :
                            </td>
                            <td colSpan={7}>
                                <b>
                                    <label id="lblPermanentaddress">{data.permanent_address}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                If Change:
                            </td>
                            <td colSpan={7}>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                Local Address :
                            </td>
                            <td colSpan={7}>
                                <b>
                                    <label id="lbllocalAddress">{data.local_address}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                If Change:
                            </td>
                            <td colSpan={7}>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                E-Mail :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblEmail">{data.email}</label>
                                </b>
                            </td>
                            <td className="style2" style={{ width: '1050px' }}>
                                Bus Stop :
                            </td>
                            <td colSpan={5}>
                                <b>
                                    <label id="lblBusStop">{data.bus_stop}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td className="style2" style={{ width: '1050px' }}>
                                ABC ID :
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="lblABCId">{data.abc_id || ""}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={8}>
                                All the information given by me in form and on accsoft2 is true and the best of
                                my knowledge. I shall maintain attendance of 75% in theory and practical in each
                                semester.
                            </td>
                        </tr>
                        <tr style={{ height: '30px' }}>
                            <td colSpan={2}>
                                <b>
                                    <label id="Label1" style={{ marginLeft: '20px', marginTop: '25px' }}>
                                        Signature of Student</label></b>
                            </td>
                            <td className="style2" style={{ width: '1050px' }}>
                                Date :
                            </td>
                            <td colSpan={2}>
                                <b>
                                    <label id="lblDate">{data.date_sign}</label>
                                </b>
                            </td>
                            <td colSpan={3}>
                                <b>
                                    <label id="Label4" style={{ marginLeft: '20px', marginTop: '25px' }}>
                                        Mentor/HOD (Seal &amp; Signature)</label></b>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={8}>
                                Note : Please Attach 2 PP size photos in college uniform , All previous sem marksheets
                                (photo copy).
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <table border={1} style={{ margin: '0 auto', width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                    <tr>
                    <td className="style2" style={{ width: '1050px' }}><b>Semester</b></td>
                    <td className="style2" style={{ width: '1050px' }}><b>1</b></td>
                    <td className="style2" style={{ width: '1050px' }}><b>2</b></td>
                    <td className="style2" style={{ width: '1050px' }}><b>3</b></td>
                    <td className="style2" style={{ width: '1050px' }}><b>4</b></td>
                    <td className="style2" style={{ width: '1050px' }}><b>5</b></td>
                    <td className="style2" style={{ width: '1050px' }}><b>6</b></td>
                    <td className="style2" style={{ width: '1050px' }}><b>7</b></td>
                    <td className="style2" style={{ width: '1050px' }}><b>8</b></td>
                    </tr>
                     <tr>
                    <td className="style2" style={{ width: '1050px' }}><b>Pass/Not Clear</b></td>
                    <td className="style2" style={{ width: '1050px' }}></td>
                    <td className="style2" style={{ width: '1050px' }}></td>
                    <td className="style2" style={{ width: '1050px' }}></td>
                    <td className="style2" style={{ width: '1050px' }}></td>
                    <td className="style2" style={{ width: '1050px' }}></td>
                    <td className="style2" style={{ width: '1050px' }}></td>
                    <td className="style2" style={{ width: '1050px' }}></td>
                    <td className="style2" style={{ width: '1050px' }}></td>
                    </tr>
                    </tbody>
                    </table>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12 text-center">
                    <h4>
                        <b>Accounts Use Only </b>
                        
                    </h4>
                    <table border={1} style={{ margin: '0 auto', width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                        <tr>
                            <td>
                                Bus/Hostel Fees Rs :
                            </td>
                            <td>
                                <b>
                                    <label id="lblBusHostelFee">{data.bus_hostel_fee}</label>
                                </b>
                            </td>
                            <td>
                                Receipt No.:
                            </td>
                            <td>
                                <b>
                                    <label id="lblReceiptNo">{data.receipt_no}</label>
                                </b>
                            </td>
                            <td className="style4" style={{ width: '144px' }}>
                                Date :
                            </td>
                            <td>
                                <b>
                                    <label id="Label2">{data.date_1}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                College Fees Rs :
                            </td>
                            <td>
                                <b>
                                    <label id="lblCollegeFee">{data.college_fee}</label>
                                </b>
                            </td>
                            <td>
                                Receipt No.:
                            </td>
                            <td>
                                <b>
                                    <label id="Label3">{data.receipt_no_2}</label>
                                </b>
                            </td>
                            <td className="style4" style={{ width: '144px' }}>
                                Date :
                            </td>
                            <td>
                                <b>
                                    <label id="Label5">{data.date_2}</label>
                                </b>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <br />
            <div className="row">
                <div className="col-md-12 text-right">
                    <label id="Label7">
                        <b style={{ fontSize: '16px' }}>Cashier (Seal &amp; Signature)</b></label>
                </div>
            </div>
            
            
            <div className="row">
                <div className="col-md-12 text-left">
                    <label id="Label6">
                        <b style={{ fontSize: '16px' }}>Librarian (Seal &amp; Signature)</b></label>
                </div>
            </div>
            <div className="row" style={{ position: 'relative' }}>
                <div className="col-md-12">
                    <hr className="dashed-line" style={{ width: '100%', border: 'none', borderTop: '1px dashed black' }} />
                </div>
            </div>
            <div className="row">
                <div className="col-md-12 text-center">
                    <h4 style={{ fontWeight: 'bold', textAlign: 'right', fontSize: '16px' }}>
                        <b>( Student Copy )</b>
                    </h4>
                    <h4>
                        <b>REGISTRATION SLIP </b>
                    </h4>
                    <h5 style={{ fontWeight: 'bold' }}>
                        ACADEMIC SESSION- (<label id="lblsession2">{data.session2 || data.session}</label>
                        )
                    </h5>
                    <table border={1} style={{ margin: '0 auto', width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                        <tr>
                            <td colSpan={5}>
                            </td>
                            <td rowSpan={4} style={{ width: '150px' }}>
                                {data.image2_src ? (
                                    <img id="PrintImg2" alt="Image Not Found" className="img-fluid" src={data.image2_src} style={{ borderWidth: '0px', width: '120px', height: '120px', marginLeft: '13px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '120px', height: '120px', marginLeft: '13px', border: '1px solid #ccc' }}></div>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Name of college :
                            </td>
                            <td colSpan={5}>
                                <b>
                                    <label id="lblDeptName">{data.dept_name || data.college_name}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Enrollment Number :
                            </td>
                            <td colSpan={1}>
                                <b>
                                    <label id="lblEnrNo">{data.enr_no || data.board_roll_no}</label>
                                </b>
                            </td>
                            <td>
                                Scholar No:
                            </td>
                            <td colSpan={2}>
                                <b>
                                    <label id="lblSchNo">{data.sch_no || data.scholar_no}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={6} style={{ fontSize: '16px' }}>
                                <b>
                                    <label id="lblStudentName">{data.student_name}</label>
                                </b>(AccsoftId- <b>
                                    <label id="lblAccsoftId">{data.accsoft_id || data.student_id}</label>
                                </b>)
                                <label id="lblgender">{data.gender}</label>
                                of Shri <b>
                                    <label id="lblFName">{data.f_name_2 || data.father_name}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={6}>
                                has been admitted / registerd to <b>
                                    <label id="lblCourseName2">{data.course_name_2 || data.course}</label>
                                    <label id="lblClasssemname">{data.class_sem_name || data.class_name}</label>
                                </b>Class Roll No : <b>
                                    <label id="lblclsrollno">{data.cls_roll_no_2 || data.class_roll_no}</label>
                                </b>Section Name : <b>
                                    <label id="lblsectionname">{data.section_name_2 || data.section}</label>
                                </b>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={6}>
                                Class Starting Date
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>Registration Date : -</b>
                            </td>
                            <td>
                            </td>
                            <td>
                                <b>Branch In Charge</b>
                            </td>
                            <td>
                            </td>
                            <td>
                            </td>
                            <td>
                                <b>
                                    <label id="Label14" style={{ marginLeft: '20px' }}>
                                        Registrar</label></b>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <hr style={{ border: '1px solid', width: '102%', marginLeft: '-12px', marginBottom: '0px', marginTop: '0px' }} />
        </div>`;

const startTag = '<div className="print-only" style={{ padding: \'0px\', color: \'#000\', background: \'#fff\' }}>';
const endTag = '</>';

const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = content.substring(0, startIdx) + replacement + '\n          ' + content.substring(endIdx);
    fs.writeFileSync('D:/clg/lnctuattendance/node/src/app/dashboard/registration/page.tsx', newContent);
    console.log('Successfully replaced print view');
} else {
    console.error('Could not find start or end index for print view');
}
